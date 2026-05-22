'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { authService, superAdminService } from '@/services/serviceFactory';
import { Header } from '@/components/Common/Header';
import { SuperAdminNav } from '@/components/SuperAdmin/SuperAdminNav';
import { CampaignList } from '@/components/SuperAdmin/CampaignList';
import { CampaignComposer } from '@/components/SuperAdmin/CampaignComposer';
import {
  SUPER_ADMIN_BADGE,
  CAMPAIGNS_LABELS,
  COMPOSER_LABELS,
} from '@/components/SuperAdmin/superAdmin.const';
import { CampaignDto } from '@/dtos/user.dto';

export default function SuperAdminCampaignsPage() {
  const router = useRouter();
  const { logout, user } = useAuth(authService);
  const {
    campaigns,
    campaignsLoading,
    campaignsHasMore,
    loadCampaigns,
    loadMoreCampaigns,
    sendLoading,
    sendResult,
    sendError,
    submitCampaign,
    recipientUsers,
    recipientUsersHasMore,
    recipientUsersLoading,
    loadRecipientUsers,
    loadMoreRecipientUsers,
    forbidden,
    checking,
  } = useSuperAdmin(superAdminService);

  const [showComposer, setShowComposer] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDto | null>(null);

  useEffect(() => {
    if (forbidden) router.replace('../../../dashboard');
  }, [forbidden, router]);

  useEffect(() => {
    loadCampaigns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendSuccess = sendResult
    ? COMPOSER_LABELS.successMessage(
        sendResult.campaign.stats.totalRecipients - sendResult.failedCount,
        sendResult.failedCount
      )
    : null;

  if (checking || forbidden || !user) {
    return (
      <p className='text-center text-muted-foreground py-16 text-sm'>Cargando...</p>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <Header userName={user.name} isAuthenticated onLogout={logout} badge={SUPER_ADMIN_BADGE} />
      <main className='max-w-5xl mx-auto py-8 px-4'>
        <div className='flex items-center gap-4 mb-6'>
          <Link
            href='../../../dashboard'
            className='text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            &larr; Dashboard
          </Link>
        </div>

        <section className='bg-surface border border-border p-6 rounded space-y-6'>
          <SuperAdminNav />

          <div className='flex items-center justify-between'>
            <h2 className='text-sm font-semibold text-foreground uppercase tracking-wider'>
              {CAMPAIGNS_LABELS.title}
            </h2>
            <button
              onClick={() => {
                setShowComposer((prev) => !prev);
                setSelectedCampaign(null);
              }}
              className='text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity'
            >
              {showComposer ? COMPOSER_LABELS.cancel : CAMPAIGNS_LABELS.newCampaign}
            </button>
          </div>

          {showComposer && (
            <CampaignComposer
              recipientUsers={recipientUsers}
              recipientUsersHasMore={recipientUsersHasMore}
              recipientUsersLoading={recipientUsersLoading}
              onLoadRecipientUsers={loadRecipientUsers}
              onLoadMoreRecipientUsers={loadMoreRecipientUsers}
              onSend={async (data) => {
                await submitCampaign(data);
                setShowComposer(false);
              }}
              sending={sendLoading}
              sendError={sendError}
              sendSuccess={sendSuccess}
            />
          )}

          {selectedCampaign && (
            <div className='border border-border rounded p-4 bg-muted text-sm space-y-2'>
              <div className='flex justify-between items-start'>
                <h3 className='font-medium text-foreground'>{selectedCampaign.subject}</h3>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className='text-xs text-muted-foreground hover:text-foreground'
                >
                  Cerrar
                </button>
              </div>
              <p className='text-muted-foreground text-xs'>
                {selectedCampaign.stats.totalRecipients} destinatarios ·{' '}
                {selectedCampaign.stats.clicksCount} clics
              </p>
              <iframe
                srcDoc={selectedCampaign.htmlBody}
                sandbox='allow-same-origin'
                className='w-full h-64 border border-border rounded bg-white mt-2'
                title='Vista previa'
              />
            </div>
          )}

          <CampaignList
            campaigns={campaigns}
            loading={campaignsLoading}
            hasMore={campaignsHasMore}
            onLoadMore={loadMoreCampaigns}
            onSelect={(c) => {
              setSelectedCampaign(c);
              setShowComposer(false);
            }}
          />
        </section>
      </main>
    </div>
  );
}
