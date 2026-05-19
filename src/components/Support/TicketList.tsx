'use client';

import { SupportTicketDto } from '@/dtos/user.dto';
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_TYPE_ICONS,
  TICKET_TYPE_LABELS,
  ACTION_LABELS,
  MESSAGES,
} from './support.const';

interface Props {
  tickets: SupportTicketDto[];
  loading: boolean;
  onSelect: (ticketId: string) => void;
}

/**
 * Renders the list of support tickets for the authenticated user.
 * Each card is clickable to open the ticket detail.
 */
export function TicketList({ tickets, loading, onSelect }: Props) {
  if (loading) {
    return <p className='text-sm text-muted-foreground py-4'>{MESSAGES.loading}</p>;
  }

  if (tickets.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-sm text-muted-foreground'>{MESSAGES.emptyTickets}</p>
        <p className='text-xs text-muted-foreground mt-1'>{MESSAGES.emptyTicketsHint}</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className='bg-surface border border-border rounded-lg px-4 py-3 flex items-start justify-between gap-3'
        >
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2 mb-1 flex-wrap'>
              <span className='text-sm'>{TICKET_TYPE_ICONS[ticket.type]}</span>
              <span className='text-xs text-muted-foreground'>
                {TICKET_TYPE_LABELS[ticket.type]}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${TICKET_STATUS_COLORS[ticket.status]}`}
              >
                {TICKET_STATUS_LABELS[ticket.status]}
              </span>
            </div>
            <p className='text-sm font-medium text-foreground truncate'>{ticket.title}</p>
            <p className='text-xs text-muted-foreground mt-0.5'>
              {new Date(ticket.createdAt).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={() => onSelect(ticket.id)}
            className='shrink-0 text-xs text-foreground border border-border px-3 py-1.5 rounded hover:bg-muted transition-colors whitespace-nowrap'
          >
            {ACTION_LABELS.viewDetail}
          </button>
        </div>
      ))}
    </div>
  );
}
