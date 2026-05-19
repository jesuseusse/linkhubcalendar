'use client';

import { useState } from 'react';
import { TicketType, CreateSupportTicketDto, SupportTicketDto } from '@/dtos/user.dto';
import { TicketTypeSelector } from './TicketTypeSelector';
import { ErrorReportForm, ErrorReportFormData } from './ErrorReportForm';
import { SuggestionForm, SuggestionFormData } from './SuggestionForm';
import { SUPPORT_STEPS, SupportStep, TICKET_TYPE_ICONS, TICKET_TYPE_LABELS, MESSAGES, ACTION_LABELS } from './support.const';

interface Props {
  /** Called on successful ticket creation. */
  onCreated: (ticket: SupportTicketDto) => void;
  /** Called when the wizard is dismissed (back on step 1, or close on success). */
  onDismiss: () => void;
  /** Submit handler provided by the parent (delegates to the hook). */
  onSubmit: (dto: CreateSupportTicketDto, screenshotFile?: File | null) => Promise<SupportTicketDto>;
  /** When true, the error option is blocked (open ticket already exists). */
  errorDisabled?: boolean;
  /** When true, the suggestion option is blocked. */
  suggestionDisabled?: boolean;
}

/**
 * Multi-step wizard for creating a support ticket.
 *
 * Steps:
 * 1. `select_type` — TicketTypeSelector
 * 2. `fill_form`   — ErrorReportForm | SuggestionForm
 * 3. `success`     — Confirmation screen
 */
export function TicketWizard({
  onCreated,
  onDismiss,
  onSubmit,
  errorDisabled,
  suggestionDisabled,
}: Props) {
  const [step, setStep] = useState<SupportStep>(SUPPORT_STEPS.SELECT_TYPE);
  const [selectedType, setSelectedType] = useState<TicketType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTypeSelect = (type: TicketType) => {
    setSelectedType(type);
    setStep(SUPPORT_STEPS.FILL_FORM);
  };

  const handleErrorSubmit = async (data: ErrorReportFormData) => {
    setLoading(true);
    try {
      const dto: CreateSupportTicketDto = {
        type: 'error',
        title: data.title,
        description: data.description,
        deviceType: data.deviceType || undefined,
        deviceOther: data.deviceOther || undefined,
        whatsappPhone: data.whatsappPhone || undefined,
      };
      const ticket = await onSubmit(dto, data.screenshotFile);
      onCreated(ticket);
      setStep(SUPPORT_STEPS.SUCCESS);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSubmit = async (data: SuggestionFormData) => {
    setLoading(true);
    try {
      const dto: CreateSupportTicketDto = {
        type: 'suggestion',
        title: data.title,
        description: data.description,
        whatsappPhone: data.whatsappPhone || undefined,
      };
      const ticket = await onSubmit(dto, data.screenshotFile);
      onCreated(ticket);
      setStep(SUPPORT_STEPS.SUCCESS);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='bg-surface border border-border rounded-lg p-6'>
      {step === SUPPORT_STEPS.SELECT_TYPE && (
        <>
          <TicketTypeSelector
            onSelect={handleTypeSelect}
            errorDisabled={errorDisabled}
            suggestionDisabled={suggestionDisabled}
          />
          <div className='mt-4 flex justify-start'>
            <button
              onClick={onDismiss}
              className='text-sm text-muted-foreground hover:text-foreground transition-colors'
            >
              {ACTION_LABELS.close}
            </button>
          </div>
        </>
      )}

      {step === SUPPORT_STEPS.FILL_FORM && selectedType === 'error' && (
        <>
          <h3 className='text-sm font-semibold text-foreground mb-4'>
            {TICKET_TYPE_ICONS.error} {TICKET_TYPE_LABELS.error}
          </h3>
          <ErrorReportForm
            onSubmit={handleErrorSubmit}
            onBack={() => setStep(SUPPORT_STEPS.SELECT_TYPE)}
            loading={loading}
          />
        </>
      )}

      {step === SUPPORT_STEPS.FILL_FORM && selectedType === 'suggestion' && (
        <>
          <h3 className='text-sm font-semibold text-foreground mb-4'>
            {TICKET_TYPE_ICONS.suggestion} {TICKET_TYPE_LABELS.suggestion}
          </h3>
          <SuggestionForm
            onSubmit={handleSuggestionSubmit}
            onBack={() => setStep(SUPPORT_STEPS.SELECT_TYPE)}
            loading={loading}
          />
        </>
      )}

      {step === SUPPORT_STEPS.SUCCESS && selectedType && (
        <div className='text-center py-6'>
          <div className='text-4xl mb-3'>✅</div>
          <h3 className='text-base font-semibold text-foreground mb-2'>
            {MESSAGES.successTitle}
          </h3>
          <p className='text-sm text-muted-foreground mb-6'>
            {selectedType === 'error'
              ? MESSAGES.successDescriptionError
              : MESSAGES.successDescriptionSuggestion}
          </p>
          <button
            onClick={onDismiss}
            className='px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity'
          >
            {ACTION_LABELS.close}
          </button>
        </div>
      )}
    </div>
  );
}
