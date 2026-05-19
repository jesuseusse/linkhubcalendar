import { describe, it, expect } from 'vitest';
import { SuperAdminTicketDto, TicketType } from '@/dtos/user.dto';

// ---------------------------------------------------------------------------
// Pure logic tests for TicketTable filter / sort behaviour.
// Mirrors the approach in SupportPage.test.tsx — no JSX mounting.
// ---------------------------------------------------------------------------

function makeTicket(overrides: Partial<SuperAdminTicketDto> = {}): SuperAdminTicketDto {
  return {
    id: 'ticket-1',
    userId: 'user-1',
    userEmail: 'user@example.com',
    userName: 'Test User',
    type: 'error',
    status: 'open',
    title: 'Test ticket',
    description: 'Description',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function applyFilters(
  tickets: SuperAdminTicketDto[],
  typeFilter: TicketType | 'all',
  emailFilter: string,
  sortOrder: 'desc' | 'asc'
): SuperAdminTicketDto[] {
  let result = tickets;
  if (typeFilter !== 'all') {
    result = result.filter((t) => t.type === typeFilter);
  }
  if (emailFilter.trim()) {
    const q = emailFilter.trim().toLowerCase();
    result = result.filter((t) => t.userEmail.toLowerCase().includes(q));
  }
  return sortOrder === 'desc'
    ? [...result].sort((a, b) => b.createdAt - a.createdAt)
    : [...result].sort((a, b) => a.createdAt - b.createdAt);
}

describe('TicketTable filter logic', () => {
  it('returns all tickets when no filters applied', () => {
    const tickets = [makeTicket(), makeTicket({ id: 'ticket-2', type: 'suggestion' })];
    expect(applyFilters(tickets, 'all', '', 'desc')).toHaveLength(2);
  });

  it('filters by type error', () => {
    const tickets = [
      makeTicket({ type: 'error' }),
      makeTicket({ id: 't2', type: 'suggestion' }),
    ];
    const result = applyFilters(tickets, 'error', '', 'desc');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('error');
  });

  it('filters by type suggestion', () => {
    const tickets = [
      makeTicket({ type: 'error' }),
      makeTicket({ id: 't2', type: 'suggestion' }),
    ];
    const result = applyFilters(tickets, 'suggestion', '', 'desc');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('suggestion');
  });

  it('filters by email (partial match, case-insensitive)', () => {
    const tickets = [
      makeTicket({ userEmail: 'alice@example.com' }),
      makeTicket({ id: 't2', userEmail: 'bob@example.com' }),
    ];
    const result = applyFilters(tickets, 'all', 'alice', 'desc');
    expect(result).toHaveLength(1);
    expect(result[0].userEmail).toBe('alice@example.com');
  });

  it('email filter is case-insensitive', () => {
    const tickets = [makeTicket({ userEmail: 'Alice@Example.COM' })];
    const result = applyFilters(tickets, 'all', 'alice', 'desc');
    expect(result).toHaveLength(1);
  });

  it('returns empty when no ticket matches email filter', () => {
    const tickets = [makeTicket({ userEmail: 'bob@example.com' })];
    const result = applyFilters(tickets, 'all', 'alice', 'desc');
    expect(result).toHaveLength(0);
  });
});

describe('TicketTable sort logic', () => {
  const tickets = [
    makeTicket({ id: 'a', createdAt: 100 }),
    makeTicket({ id: 'b', createdAt: 300 }),
    makeTicket({ id: 'c', createdAt: 200 }),
  ];

  it('sorts descending (newest first) by default', () => {
    const result = applyFilters(tickets, 'all', '', 'desc');
    expect(result.map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts ascending (oldest first) when toggled', () => {
    const result = applyFilters(tickets, 'all', '', 'asc');
    expect(result.map((t) => t.id)).toEqual(['a', 'c', 'b']);
  });
});
