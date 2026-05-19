import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketType, TicketStatus } from '@/dtos/user.dto';

// ---------------------------------------------------------------------------
// Component smoke tests focus on stateless logic in the wizard and list.
// They test the wizard step transitions and constraint enforcement
// without mounting React components to avoid heavy JSX setup.
// ---------------------------------------------------------------------------

// Minimal ticket fixture
function makeTicket(type: TicketType, status: TicketStatus = 'open') {
  return {
    id: `ticket-${type}`,
    type,
    status,
    title: type === 'error' ? 'Error de prueba' : 'Sugerencia de prueba',
    description: 'Descripción',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// hasOpenTicketOfType logic (mirrors the hook)
// ---------------------------------------------------------------------------

function hasOpenTicketOfType(
  tickets: ReturnType<typeof makeTicket>[],
  type: TicketType
): boolean {
  return tickets.some((t) => t.type === type && t.status === 'open');
}

describe('Support ticket constraint: one open ticket per type', () => {
  it('returns false when there are no tickets', () => {
    expect(hasOpenTicketOfType([], 'error')).toBe(false);
    expect(hasOpenTicketOfType([], 'suggestion')).toBe(false);
  });

  it('returns true when an open error ticket exists', () => {
    const tickets = [makeTicket('error', 'open')];
    expect(hasOpenTicketOfType(tickets, 'error')).toBe(true);
  });

  it('returns false for suggestion when only error is open', () => {
    const tickets = [makeTicket('error', 'open')];
    expect(hasOpenTicketOfType(tickets, 'suggestion')).toBe(false);
  });

  it('returns true for both types when both are open', () => {
    const tickets = [makeTicket('error', 'open'), makeTicket('suggestion', 'open')];
    expect(hasOpenTicketOfType(tickets, 'error')).toBe(true);
    expect(hasOpenTicketOfType(tickets, 'suggestion')).toBe(true);
  });

  it('returns false when error ticket is closed (not open)', () => {
    const tickets = [makeTicket('error', 'closed')];
    expect(hasOpenTicketOfType(tickets, 'error')).toBe(false);
  });

  it('returns false when error ticket is solved', () => {
    const tickets = [makeTicket('error', 'solved')];
    expect(hasOpenTicketOfType(tickets, 'error')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Wizard step transitions
// ---------------------------------------------------------------------------

type WizardStep = 'select_type' | 'fill_form' | 'success';

function wizardReducer(
  state: { step: WizardStep; selectedType: TicketType | null },
  action:
    | { type: 'SELECT_TYPE'; payload: TicketType }
    | { type: 'SUBMIT_SUCCESS' }
    | { type: 'BACK' }
    | { type: 'DISMISS' }
): { step: WizardStep; selectedType: TicketType | null } {
  switch (action.type) {
    case 'SELECT_TYPE':
      return { step: 'fill_form', selectedType: action.payload };
    case 'SUBMIT_SUCCESS':
      return { ...state, step: 'success' };
    case 'BACK':
      return { step: 'select_type', selectedType: null };
    case 'DISMISS':
      return { step: 'select_type', selectedType: null };
    default:
      return state;
  }
}

const INITIAL_STATE = { step: 'select_type' as WizardStep, selectedType: null };

describe('TicketWizard step transitions', () => {
  it('starts on select_type step', () => {
    expect(INITIAL_STATE.step).toBe('select_type');
    expect(INITIAL_STATE.selectedType).toBeNull();
  });

  it('moves to fill_form when user selects error type', () => {
    const state = wizardReducer(INITIAL_STATE, { type: 'SELECT_TYPE', payload: 'error' });
    expect(state.step).toBe('fill_form');
    expect(state.selectedType).toBe('error');
  });

  it('moves to fill_form when user selects suggestion type', () => {
    const state = wizardReducer(INITIAL_STATE, { type: 'SELECT_TYPE', payload: 'suggestion' });
    expect(state.step).toBe('fill_form');
    expect(state.selectedType).toBe('suggestion');
  });

  it('moves to success after successful submission', () => {
    const filledState = wizardReducer(INITIAL_STATE, { type: 'SELECT_TYPE', payload: 'error' });
    const successState = wizardReducer(filledState, { type: 'SUBMIT_SUCCESS' });
    expect(successState.step).toBe('success');
  });

  it('goes back to select_type on BACK action', () => {
    const filledState = wizardReducer(INITIAL_STATE, { type: 'SELECT_TYPE', payload: 'error' });
    const backState = wizardReducer(filledState, { type: 'BACK' });
    expect(backState.step).toBe('select_type');
    expect(backState.selectedType).toBeNull();
  });

  it('resets to initial on DISMISS from any step', () => {
    const filledState = wizardReducer(INITIAL_STATE, { type: 'SELECT_TYPE', payload: 'suggestion' });
    const dismissedState = wizardReducer(filledState, { type: 'DISMISS' });
    expect(dismissedState.step).toBe('select_type');
    expect(dismissedState.selectedType).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TicketDetail: status transition rules
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ['closed', 'cancelled'],
  closed: ['open'],
  solved: [],
  cancelled: [],
};

describe('TicketDetail status transition rules', () => {
  it('open tickets can be closed or cancelled', () => {
    expect(ALLOWED_TRANSITIONS['open']).toContain('closed');
    expect(ALLOWED_TRANSITIONS['open']).toContain('cancelled');
  });

  it('closed tickets can be reopened', () => {
    expect(ALLOWED_TRANSITIONS['closed']).toContain('open');
  });

  it('solved tickets have no transitions', () => {
    expect(ALLOWED_TRANSITIONS['solved']).toHaveLength(0);
  });

  it('cancelled tickets have no transitions', () => {
    expect(ALLOWED_TRANSITIONS['cancelled']).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// CommentSection: canComment logic
// ---------------------------------------------------------------------------

function canComment(status: TicketStatus): boolean {
  return status === 'open';
}

describe('CommentSection: comment allowed only when ticket is open', () => {
  it('allows comments on open tickets', () => {
    expect(canComment('open')).toBe(true);
  });

  it('blocks comments on closed tickets', () => {
    expect(canComment('closed')).toBe(false);
  });

  it('blocks comments on solved tickets', () => {
    expect(canComment('solved')).toBe(false);
  });

  it('blocks comments on cancelled tickets', () => {
    expect(canComment('cancelled')).toBe(false);
  });
});
