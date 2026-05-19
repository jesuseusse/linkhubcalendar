'use client';

import { SuperAdminTicketDto, TicketType } from '@/dtos/user.dto';
import { TICKET_STATUS_LABELS, TICKET_STATUS_COLORS, TICKET_TYPE_ICONS } from '@/components/Support/support.const';
import { TICKETS_LABELS } from './superAdmin.const';

interface Props {
  tickets: SuperAdminTicketDto[];
  loading: boolean;
  typeFilter: TicketType | 'all';
  emailFilter: string;
  sortOrder: 'desc' | 'asc';
  onSortToggle: () => void;
  onTypeFilter: (type: TicketType | 'all') => void;
  onEmailFilter: (email: string) => void;
  onSelect: (ticket: SuperAdminTicketDto) => void;
}

export function TicketTable({
  tickets,
  loading,
  typeFilter,
  emailFilter,
  sortOrder,
  onSortToggle,
  onTypeFilter,
  onEmailFilter,
  onSelect,
}: Props) {
  return (
    <div>
      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-3 mb-4'>
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilter(e.target.value as TicketType | 'all')}
          className='text-sm border border-border rounded px-3 py-2 bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-ring'
        >
          <option value='all'>{TICKETS_LABELS.filterAll}</option>
          <option value='error'>{TICKETS_LABELS.filterError}</option>
          <option value='suggestion'>{TICKETS_LABELS.filterSuggestion}</option>
        </select>

        <input
          type='text'
          value={emailFilter}
          onChange={(e) => onEmailFilter(e.target.value)}
          placeholder={TICKETS_LABELS.filterEmailPlaceholder}
          className='flex-1 text-sm border border-border rounded px-3 py-2 bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
        />

        <button
          onClick={onSortToggle}
          className='shrink-0 text-sm border border-border rounded px-3 py-2 bg-surface text-foreground hover:bg-muted transition-colors'
        >
          {sortOrder === 'desc' ? TICKETS_LABELS.sortNewest : TICKETS_LABELS.sortOldest}
        </button>
      </div>

      {loading ? (
        <p className='text-sm text-muted-foreground py-4'>{TICKETS_LABELS.loading}</p>
      ) : tickets.length === 0 ? (
        <p className='text-sm text-muted-foreground py-4'>{TICKETS_LABELS.empty}</p>
      ) : (
        <div className='divide-y divide-border border border-border rounded-lg overflow-hidden'>
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => onSelect(ticket)}
              className='w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors'
            >
              <span className='text-lg shrink-0'>{TICKET_TYPE_ICONS[ticket.type]}</span>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-foreground truncate'>{ticket.title}</p>
                <p className='text-xs text-muted-foreground truncate'>{ticket.userEmail}</p>
              </div>
              <span
                className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${TICKET_STATUS_COLORS[ticket.status]}`}
              >
                {TICKET_STATUS_LABELS[ticket.status]}
              </span>
              <time className='shrink-0 text-xs text-muted-foreground'>
                {new Date(ticket.createdAt).toLocaleDateString('es-MX')}
              </time>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
