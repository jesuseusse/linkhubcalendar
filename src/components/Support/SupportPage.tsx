'use client';

import { useState } from 'react';
import { ISupportService } from '@/interfaces/ISupportService';
import { CreateSupportTicketDto, SupportTicketDto } from '@/dtos/user.dto';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { TicketList } from './TicketList';
import { TicketDetail } from './TicketDetail';
import { TicketWizard } from './TicketWizard';
import {
  SECTION_TITLE,
  SECTION_DESCRIPTION,
  ACTION_LABELS,
} from './support.const';

interface Props {
  supportService: ISupportService;
}

/**
 * Main client component for the support & suggestions dashboard section.
 * Orchestrates the ticket list, ticket detail view, and the new-ticket wizard.
 */
export function SupportPage({ supportService }: Props) {
  const {
    tickets,
    loading,
    selectedTicket,
    loadingDetail,
    selectTicket,
    clearSelectedTicket,
    createTicket,
    updateStatus,
    addComment,
    hasOpenTicketOfType,
  } = useSupportTickets(supportService);

  const [showWizard, setShowWizard] = useState(false);

  const handleCreated = (_ticket: SupportTicketDto) => {
    // Wizard shows success screen; list is already updated via the hook
  };

  const handleSubmit = async (dto: CreateSupportTicketDto, screenshotFile?: File | null) => {
    return createTicket(dto, screenshotFile);
  };

  if (selectedTicket) {
    return (
      <div>
        <TicketDetail
          detail={selectedTicket}
          onAddComment={async (content) => { await addComment(selectedTicket.ticket.id, content); }}
          onUpdateStatus={(status) => updateStatus(selectedTicket.ticket.id, status)}
          onBack={clearSelectedTicket}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Section header */}
      <div className='flex items-start justify-between gap-4 mb-6'>
        <div>
          <h2 className='text-sm font-semibold text-foreground uppercase tracking-wider'>
            {SECTION_TITLE}
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>{SECTION_DESCRIPTION}</p>
        </div>
        {!showWizard && (
          <button
            onClick={() => setShowWizard(true)}
            className='shrink-0 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity'
          >
            {ACTION_LABELS.createNewTicket}
          </button>
        )}
      </div>

      {/* New ticket wizard */}
      {showWizard && (
        <div className='mb-6'>
          <TicketWizard
            onCreated={handleCreated}
            onDismiss={() => setShowWizard(false)}
            onSubmit={handleSubmit}
            errorDisabled={hasOpenTicketOfType('error')}
            suggestionDisabled={hasOpenTicketOfType('suggestion')}
          />
        </div>
      )}

      {/* Ticket list */}
      {loadingDetail ? (
        <p className='text-sm text-muted-foreground py-4'>Cargando...</p>
      ) : (
        <TicketList
          tickets={tickets}
          loading={loading}
          onSelect={selectTicket}
        />
      )}
    </div>
  );
}
