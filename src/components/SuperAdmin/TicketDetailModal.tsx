'use client';

import { SuperAdminTicketDto, TicketDetailDto, TicketStatus } from '@/dtos/user.dto';
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_TYPE_ICONS,
  TICKET_TYPE_LABELS,
} from '@/components/Support/support.const';
import { CommentSection } from '@/components/Support/CommentSection';
import { MODAL_LABELS, LOADING_TEXT } from './superAdmin.const';

const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ['closed', 'cancelled'],
  closed: ['open', 'solved'],
  solved: [],
  cancelled: [],
};

interface Props {
  ticket: SuperAdminTicketDto;
  detail: TicketDetailDto | null;
  loadingDetail: boolean;
  onClose: () => void;
  onUpdateStatus: (status: TicketStatus) => Promise<void>;
  onAddComment: (content: string) => Promise<void>;
}

export function TicketDetailModal({
  ticket,
  detail,
  loadingDetail,
  onClose,
  onUpdateStatus,
  onAddComment,
}: Props) {
  const transitions = ALLOWED_TRANSITIONS[ticket.status] ?? [];

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40'
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className='relative bg-surface border border-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl'>
        {/* Header */}
        <div className='flex items-start justify-between gap-3 px-5 py-4 border-b border-border'>
          <div className='flex items-center gap-2 min-w-0'>
            <span className='text-xl shrink-0'>{TICKET_TYPE_ICONS[ticket.type]}</span>
            <div className='min-w-0'>
              <p className='text-xs text-muted-foreground'>{TICKET_TYPE_LABELS[ticket.type]}</p>
              <h3 className='text-sm font-semibold text-foreground leading-snug truncate'>
                {ticket.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={MODAL_LABELS.close}
            className='shrink-0 text-muted-foreground hover:text-foreground transition-colors'
          >
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
              <path d='M18 6 6 18M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className='overflow-y-auto flex-1 px-5 py-4 space-y-4'>
          {/* Meta */}
          <div className='flex flex-wrap gap-3 text-xs text-muted-foreground'>
            <span>
              <span className='font-medium text-foreground'>{MODAL_LABELS.reportedBy}:</span>{' '}
              {ticket.userName} · {ticket.userEmail}
            </span>
            <span>
              <span className='font-medium text-foreground'>{MODAL_LABELS.createdAt}:</span>{' '}
              {new Date(ticket.createdAt).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span
              className={`font-medium px-2 py-0.5 rounded ${TICKET_STATUS_COLORS[ticket.status]}`}
            >
              {TICKET_STATUS_LABELS[ticket.status]}
            </span>
          </div>

          {/* Description */}
          <p className='text-sm text-foreground whitespace-pre-wrap'>{ticket.description}</p>

          {/* Optional fields */}
          {ticket.deviceType && (
            <p className='text-xs text-muted-foreground'>
              <span className='font-medium text-foreground'>{MODAL_LABELS.device}:</span>{' '}
              {ticket.deviceType}{ticket.deviceOther ? ` (${ticket.deviceOther})` : ''}
            </p>
          )}
          {ticket.screenshotUrl && (
            <a
              href={ticket.screenshotUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-xs text-primary underline underline-offset-2'
            >
              {MODAL_LABELS.screenshot}
            </a>
          )}
          {ticket.whatsappPhone && (
            <p className='text-xs text-muted-foreground'>
              <span className='font-medium text-foreground'>{MODAL_LABELS.whatsapp}:</span>{' '}
              {ticket.whatsappPhone}
            </p>
          )}

          {/* Status transitions */}
          {transitions.length > 0 && (
            <div>
              <p className='text-xs font-medium text-muted-foreground mb-2'>
                {MODAL_LABELS.changeStatus}:
              </p>
              <div className='flex flex-wrap gap-2'>
                {transitions.map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdateStatus(s)}
                    className='px-3 py-1 text-xs font-medium border border-border rounded hover:bg-muted transition-colors'
                  >
                    {TICKET_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comment thread */}
          {loadingDetail ? (
            <p className='text-sm text-muted-foreground'>{LOADING_TEXT}</p>
          ) : detail ? (
            <CommentSection
              comments={detail.comments}
              ticketStatus={ticket.status}
              onAddComment={onAddComment}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
