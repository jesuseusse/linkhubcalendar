'use client';

import { TicketDetailDto, TicketStatus } from '@/dtos/user.dto';
import { CommentSection } from './CommentSection';
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_TYPE_LABELS,
  TICKET_TYPE_ICONS,
  ACTION_LABELS,
} from './support.const';

interface Props {
  detail: TicketDetailDto;
  onAddComment: (content: string) => Promise<void>;
  onUpdateStatus: (status: TicketStatus) => Promise<void>;
  onBack: () => void;
}

const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ['closed', 'cancelled'],
  closed: ['open'],
  solved: [],
  cancelled: [],
};

/**
 * Shows the full detail of a support ticket including metadata, screenshot, and comment thread.
 * Allows the user to change the ticket status and add comments (while `open`).
 */
export function TicketDetail({ detail, onAddComment, onUpdateStatus, onBack }: Props) {
  const { ticket, comments } = detail;
  const transitions = ALLOWED_TRANSITIONS[ticket.status];

  return (
    <div>
      <button
        onClick={onBack}
        className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4'
      >
        ← Volver
      </button>

      <div className='bg-surface border border-border rounded-lg p-5'>
        {/* Header */}
        <div className='flex flex-wrap items-start justify-between gap-3 mb-4'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <span className='text-base'>{TICKET_TYPE_ICONS[ticket.type]}</span>
              <span className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>
                {TICKET_TYPE_LABELS[ticket.type]}
              </span>
            </div>
            <h3 className='text-base font-semibold text-foreground'>{ticket.title}</h3>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${TICKET_STATUS_COLORS[ticket.status]}`}
          >
            {TICKET_STATUS_LABELS[ticket.status]}
          </span>
        </div>

        {/* Description */}
        <p className='text-sm text-foreground whitespace-pre-wrap mb-4'>{ticket.description}</p>

        {/* Device info */}
        {ticket.deviceType && (
          <p className='text-xs text-muted-foreground mb-2'>
            <span className='font-medium'>Dispositivo:</span>{' '}
            {ticket.deviceType === 'other' && ticket.deviceOther
              ? ticket.deviceOther
              : ticket.deviceType}
          </p>
        )}

        {/* Screenshot */}
        {ticket.screenshotUrl && (
          <div className='mb-4'>
            <p className='text-xs text-muted-foreground mb-1 font-medium'>Captura adjunta:</p>
            <a href={ticket.screenshotUrl} target='_blank' rel='noopener noreferrer'>
              <img
                src={ticket.screenshotUrl}
                alt='Captura de pantalla'
                className='max-h-40 rounded border border-border object-contain cursor-pointer hover:opacity-90'
              />
            </a>
          </div>
        )}

        {/* Metadata */}
        <p className='text-xs text-muted-foreground mb-1'>
          <span className='font-medium'>Creado:</span>{' '}
          {new Date(ticket.createdAt).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        {ticket.whatsappPhone && (
          <p className='text-xs text-muted-foreground mb-1'>
            <span className='font-medium'>WhatsApp:</span> {ticket.whatsappPhone}
          </p>
        )}

        {/* Status transitions */}
        {transitions.length > 0 && (
          <div className='mt-4 pt-4 border-t border-border flex flex-wrap gap-2'>
            {transitions.map((status) => (
              <button
                key={status}
                onClick={() => onUpdateStatus(status)}
                className='px-3 py-1.5 text-xs border border-border rounded hover:bg-muted transition-colors text-foreground'
              >
                {ACTION_LABELS.changeStatus}: {TICKET_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        )}

        {/* Comment thread */}
        <CommentSection
          comments={comments}
          ticketStatus={ticket.status}
          onAddComment={onAddComment}
        />
      </div>
    </div>
  );
}
