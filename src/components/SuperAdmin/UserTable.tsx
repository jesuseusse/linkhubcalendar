'use client';

import { useState } from 'react';
import { UserSummaryDto } from '@/dtos/user.dto';
import { USERS_LABELS, LOADING_TEXT } from './superAdmin.const';
import { EmailExportModal } from './EmailExportModal';

interface Props {
  users: UserSummaryDto[];
  allEmails: string[];
  totalCount: number;
  loading: boolean;
  sortBy: 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  onSort: (by: 'createdAt' | 'updatedAt') => void;
  hasMore: boolean;
  onLoadMore: () => void;
  planFilter: string;
  onPlanFilterChange: (plan: string) => void;
}

function formatRelativeTime(ms: number): string {
  const diffSeconds = Math.round((ms - Date.now()) / 1000);
  const divisions: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];
  const rtf = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' });
  for (const [unit, secondsInUnit] of divisions) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return rtf.format(diffSeconds, 'second');
}

function getStatusInfo(user: UserSummaryDto): { label: string; className: string } | null {
  const isPro = user.plan === 'pro' || user.plan === 'team';
  if (!isPro) return null;
  if (user.subscriptionStatus === 'past_due') {
    return { label: USERS_LABELS.statusPastDue, className: 'text-error' };
  }
  if (user.subscriptionCancelAtPeriodEnd) {
    return { label: USERS_LABELS.statusCancelScheduled, className: 'text-yellow-700' };
  }
  return { label: USERS_LABELS.statusActive, className: 'text-green-700' };
}

const TH_CLASS =
  'sticky top-0 z-10 bg-surface py-2 px-4 font-medium text-muted-foreground text-xs text-left border-b border-border first:pl-3';

function SortHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  field: 'createdAt' | 'updatedAt';
  sortBy: 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  onSort: (by: 'createdAt' | 'updatedAt') => void;
}) {
  const active = sortBy === field;
  return (
    <th className={TH_CLASS}>
      <button
        type='button'
        onClick={() => onSort(field)}
        className={`flex items-center gap-1 text-xs font-medium transition-colors ${
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {label}
        <span className='material-icons text-[14px]'>
          {active ? (sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward') : 'unfold_more'}
        </span>
      </button>
    </th>
  );
}

export function UserTable({
  users,
  allEmails,
  totalCount,
  loading,
  sortBy,
  sortOrder,
  onSort,
  hasMore,
  onLoadMore,
  planFilter,
  onPlanFilterChange,
}: Props) {
  const [showExport, setShowExport] = useState(false);

  if (loading && users.length === 0) {
    return <p className='text-sm text-muted-foreground py-4'>{LOADING_TEXT}</p>;
  }

  if (!loading && totalCount === 0) {
    return <p className='text-sm text-muted-foreground py-4'>{USERS_LABELS.empty}</p>;
  }

  return (
    <div className='space-y-3'>
      {/* Controls bar */}
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <div className='flex items-center gap-3'>
          <span className='text-xs text-muted-foreground'>
            {USERS_LABELS.showing(users.length, totalCount)}
          </span>
          <select
            value={planFilter}
            onChange={(e) => onPlanFilterChange(e.target.value)}
            className='text-xs border border-border rounded px-2 py-1.5 bg-background text-foreground'
            aria-label={USERS_LABELS.filterPlanLabel}
          >
            <option value=''>{USERS_LABELS.filterPlanAll}</option>
            <option value='free'>{USERS_LABELS.filterPlanFree}</option>
            <option value='pro'>{USERS_LABELS.filterPlanPro}</option>
            <option value='team'>{USERS_LABELS.filterPlanTeam}</option>
          </select>
        </div>
        <button
          type='button'
          onClick={() => setShowExport(true)}
          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground rounded transition-colors'
        >
          <span className='material-icons text-[16px]'>download</span>
          {USERS_LABELS.exportEmails}
        </button>
      </div>

      {/* Table — header stays pinned, body scrolls both axes within a bounded box */}
      <div className='overflow-auto max-h-150 border border-border rounded'>
        <table className='w-full text-sm border-collapse'>
          <thead>
            <tr>
              <th className={TH_CLASS}>{USERS_LABELS.colUser}</th>
              <th className={TH_CLASS}>{USERS_LABELS.colPlanStatus}</th>
              <th className={TH_CLASS}>{USERS_LABELS.colLinks}</th>
              <th className={TH_CLASS}>{USERS_LABELS.colAppointments30d}</th>
              <SortHeader
                label={USERS_LABELS.colLastActivity}
                field='updatedAt'
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
              <SortHeader
                label={USERS_LABELS.colCreatedAt}
                field='createdAt'
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const status = getStatusInfo(user);
              return (
                <tr key={user.id} className='border-b border-border last:border-0'>
                  <td className='py-3 px-4'>
                    <div className='flex items-center gap-3 min-w-55'>
                      {user.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt={user.name}
                          width={32}
                          height={32}
                          className='w-8 h-8 rounded-full object-cover shrink-0'
                        />
                      ) : (
                        <span
                          className='w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground select-none shrink-0'
                          aria-hidden='true'
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className='min-w-0'>
                        {user.username ? (
                          <a
                            href={`/${user.username}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='block font-medium text-foreground hover:text-primary hover:underline underline-offset-2 truncate'
                            title={user.name}
                          >
                            {user.name}
                          </a>
                        ) : (
                          <span className='block font-medium text-foreground truncate'>{user.name}</span>
                        )}
                        {user.username && (
                          <div className='text-xs text-muted-foreground truncate'>@{user.username}</div>
                        )}
                        <div className='text-xs text-muted-foreground truncate'>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className='py-3 px-4'>
                    <div className='flex flex-col items-start gap-1'>
                      {user.plan ? (
                        <span className='inline-block px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded capitalize'>
                          {user.plan}
                        </span>
                      ) : (
                        <span className='text-muted-foreground text-xs'>free</span>
                      )}
                      {status && <span className={`text-[11px] whitespace-nowrap ${status.className}`}>{status.label}</span>}
                    </div>
                  </td>
                  <td className='py-3 px-4 text-foreground text-sm'>
                    {user.links.length === 0 ? (
                      <span className='text-muted-foreground'>—</span>
                    ) : (
                      <span title={user.links.map((l) => l.title).join(', ')}>
                        {user.links.length}
                      </span>
                    )}
                  </td>
                  <td className='py-3 px-4 text-sm'>
                    {user.appointmentsLast30d > 0 ? (
                      <span className='font-medium text-foreground'>{user.appointmentsLast30d}</span>
                    ) : (
                      <span className='text-muted-foreground'>—</span>
                    )}
                  </td>
                  <td className='py-3 px-4 text-sm text-muted-foreground whitespace-nowrap'>
                    {formatRelativeTime(user.updatedAt)}
                  </td>
                  <td className='py-3 px-4 text-sm text-muted-foreground whitespace-nowrap'>
                    {new Date(user.createdAt).toLocaleDateString('es-MX')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {hasMore && (
        <div className='flex justify-center pt-2'>
          <button
            type='button'
            onClick={onLoadMore}
            disabled={loading}
            className='px-4 py-2 text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground rounded transition-colors disabled:opacity-50'
          >
            {loading ? USERS_LABELS.loading : USERS_LABELS.loadMore}
          </button>
        </div>
      )}

      {/* Export modal */}
      {showExport && (
        <EmailExportModal
          emails={allEmails}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
