'use client';

import { TicketType } from '@/dtos/user.dto';
import {
  TICKET_TYPE_LABELS,
  TICKET_TYPE_DESCRIPTIONS,
  TICKET_TYPE_ICONS,
  MESSAGES,
} from './support.const';

interface Props {
  /** Called when the user picks a ticket type. */
  onSelect: (type: TicketType) => void;
  /** When true, the error button is disabled (open ticket already exists). */
  errorDisabled?: boolean;
  /** When true, the suggestion button is disabled. */
  suggestionDisabled?: boolean;
}

const TYPES: TicketType[] = ['error', 'suggestion'];

/**
 * Step 1 of the support wizard: the user picks whether to report a bug or send a suggestion.
 * Disabled states are shown when the user already has an open ticket of that type.
 */
export function TicketTypeSelector({ onSelect, errorDisabled, suggestionDisabled }: Props) {
  const isDisabled = (type: TicketType) =>
    type === 'error' ? errorDisabled : suggestionDisabled;

  return (
    <div>
      <h3 className='text-base font-semibold text-foreground mb-1'>¿En qué podemos ayudarte?</h3>
      <p className='text-sm text-muted-foreground mb-6'>
        Elige el tipo de ticket que deseas abrir.
      </p>
      <div className='grid gap-3 sm:grid-cols-2'>
        {TYPES.map((type) => {
          const disabled = isDisabled(type);
          return (
            <button
              key={type}
              onClick={() => !disabled && onSelect(type)}
              disabled={disabled}
              className={[
                'flex flex-col gap-2 p-4 rounded-lg border text-left transition-colors',
                disabled
                  ? 'opacity-50 cursor-not-allowed border-border bg-muted'
                  : 'border-border bg-surface hover:bg-muted cursor-pointer',
              ].join(' ')}
            >
              <span className='text-2xl'>{TICKET_TYPE_ICONS[type]}</span>
              <span className='text-sm font-semibold text-foreground'>
                {TICKET_TYPE_LABELS[type]}
              </span>
              <span className='text-xs text-muted-foreground leading-relaxed'>
                {disabled
                  ? MESSAGES.openTicketLimit(type)
                  : TICKET_TYPE_DESCRIPTIONS[type]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
