'use client';

import { SuperAdminStatsDto } from '@/dtos/user.dto';
import { STATS_LABELS, LOADING_TEXT } from './superAdmin.const';

interface Props {
  stats: SuperAdminStatsDto | null;
  loading: boolean;
}

export function StatsPanel({ stats, loading }: Props) {
  if (loading) {
    return <p className='text-sm text-muted-foreground py-4'>{LOADING_TEXT}</p>;
  }

  const cards = [
    { label: STATS_LABELS.totalUsers, value: stats?.totalUsers ?? 0 },
    { label: STATS_LABELS.paidUsers, value: stats?.usersWithActivePaidPlan ?? 0 },
  ];

  return (
    <div>
      <h2 className='text-sm font-semibold text-foreground uppercase tracking-wider mb-4'>
        {STATS_LABELS.title}
      </h2>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {cards.map((card) => (
          <div key={card.label} className='bg-surface border border-border rounded-lg p-5'>
            <p className='text-xs text-muted-foreground mb-1'>{card.label}</p>
            <p className='text-3xl font-bold text-foreground'>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
