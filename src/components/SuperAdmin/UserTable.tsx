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
    <th className='py-2 pr-4 font-medium text-left'>
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

      {/* Table */}
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-border text-left'>
              <th className='py-2 pr-4 font-medium text-muted-foreground text-xs'>{USERS_LABELS.colPhoto}</th>
              <th className='py-2 pr-4 font-medium text-muted-foreground text-xs'>{USERS_LABELS.colEmail}</th>
              <th className='py-2 pr-4 font-medium text-muted-foreground text-xs'>{USERS_LABELS.colPlan}</th>
              <th className='py-2 pr-4 font-medium text-muted-foreground text-xs'>{USERS_LABELS.colLinks}</th>
              <SortHeader
                label={USERS_LABELS.colCreatedAt}
                field='createdAt'
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
              <SortHeader
                label={USERS_LABELS.colUpdatedAt}
                field='updatedAt'
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
              <th className='py-2 font-medium text-muted-foreground text-xs'>{USERS_LABELS.colProfile}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className='border-b border-border last:border-0'>
                <td className='py-3 pr-4'>
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      width={32}
                      height={32}
                      className='w-8 h-8 rounded-full object-cover'
                    />
                  ) : (
                    <span
                      className='w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground select-none'
                      aria-hidden='true'
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </td>
                <td className='py-3 pr-4 text-foreground text-sm'>{user.email}</td>
                <td className='py-3 pr-4'>
                  {user.plan ? (
                    <span className='inline-block px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded capitalize'>
                      {user.plan}
                    </span>
                  ) : (
                    <span className='text-muted-foreground text-xs'>free</span>
                  )}
                </td>
                <td className='py-3 pr-4 text-foreground text-sm'>
                  {user.links.length === 0 ? (
                    <span className='text-muted-foreground'>—</span>
                  ) : (
                    <span title={user.links.map((l) => l.title).join(', ')}>
                      {user.links.length}
                    </span>
                  )}
                </td>
                <td className='py-3 pr-4 text-sm text-muted-foreground whitespace-nowrap'>
                  {new Date(user.createdAt).toLocaleDateString('es-MX')}
                </td>
                <td className='py-3 pr-4 text-sm text-muted-foreground whitespace-nowrap'>
                  {new Date(user.updatedAt).toLocaleDateString('es-MX')}
                </td>
                <td className='py-3'>
                  {user.username ? (
                    <a
                      href={`/${user.username}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary underline underline-offset-2 hover:opacity-80 transition-opacity text-sm'
                    >
                      {USERS_LABELS.viewProfile}
                    </a>
                  ) : (
                    <span className='text-muted-foreground'>{USERS_LABELS.noUsername}</span>
                  )}
                </td>
              </tr>
            ))}
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
