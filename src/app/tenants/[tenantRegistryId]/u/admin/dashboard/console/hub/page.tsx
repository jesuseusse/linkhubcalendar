'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { authService, superAdminService } from '@/services/serviceFactory';
import { Header } from '@/components/Common/Header';
import { SuperAdminNav } from '@/components/SuperAdmin/SuperAdminNav';
import { StatsPanel } from '@/components/SuperAdmin/StatsPanel';
import { SUPER_ADMIN_BADGE } from '@/components/SuperAdmin/superAdmin.const';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const { logout, user } = useAuth(authService);
  const { stats, statsLoading, forbidden } = useSuperAdmin(superAdminService);

  useEffect(() => {
    if (forbidden) router.replace('../dashboard');
  }, [forbidden, router]);

  if (!user) {
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
            href='../dashboard'
            className='text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            &larr; Dashboard
          </Link>
        </div>
        <section className='bg-surface border border-border p-6 rounded'>
          <SuperAdminNav />
          <StatsPanel stats={stats} loading={statsLoading} />
        </section>
      </main>
    </div>
  );
}
