'use client';

import { CampaignDto } from '@/dtos/user.dto';
import { CAMPAIGNS_LABELS } from './superAdmin.const';

interface Props {
  campaigns: CampaignDto[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelect: (campaign: CampaignDto) => void;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CampaignList({ campaigns, loading, hasMore, onLoadMore, onSelect }: Props) {
  if (loading && campaigns.length === 0) {
    return <p className='text-sm text-muted-foreground py-4'>{CAMPAIGNS_LABELS.loading}</p>;
  }

  if (!loading && campaigns.length === 0) {
    return <p className='text-sm text-muted-foreground py-4'>{CAMPAIGNS_LABELS.empty}</p>;
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-border text-left text-muted-foreground'>
            <th className='pb-2 font-medium'>{CAMPAIGNS_LABELS.colSubject}</th>
            <th className='pb-2 font-medium'>{CAMPAIGNS_LABELS.colStatus}</th>
            <th className='pb-2 font-medium text-right'>{CAMPAIGNS_LABELS.colRecipients}</th>
            <th className='pb-2 font-medium text-right'>{CAMPAIGNS_LABELS.colClicks}</th>
            <th className='pb-2 font-medium text-right'>{CAMPAIGNS_LABELS.colSentAt}</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr
              key={c.id}
              className='border-b border-border hover:bg-muted/40 cursor-pointer transition-colors'
              onClick={() => onSelect(c)}
            >
              <td className='py-2 pr-4 font-medium text-foreground truncate max-w-xs'>{c.subject}</td>
              <td className='py-2 pr-4'>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    c.status === 'sent'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {c.status === 'sent' ? CAMPAIGNS_LABELS.statusSent : CAMPAIGNS_LABELS.statusDraft}
                </span>
              </td>
              <td className='py-2 pr-4 text-right text-muted-foreground'>{c.stats.totalRecipients}</td>
              <td className='py-2 pr-4 text-right text-muted-foreground'>{c.stats.clicksCount}</td>
              <td className='py-2 text-right text-muted-foreground'>
                {c.sentAt ? formatDate(c.sentAt) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <div className='mt-4 flex justify-center'>
          <button
            onClick={onLoadMore}
            disabled={loading}
            className='text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50'
          >
            {loading ? CAMPAIGNS_LABELS.loading : CAMPAIGNS_LABELS.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}
