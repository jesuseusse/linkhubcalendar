import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GetSuperAdminStatsUseCase,
  GetAllUsersUseCase,
  GetAllTicketsUseCase,
} from './SuperAdminUseCases';
import type { IUserRepository } from '@/domain/interfaces/IUserRepository';
import type { ISupportTicketRepository } from '@/domain/interfaces/ISupportTicketRepository';
import type { User } from '@/domain/entities/User';
import type { SupportTicket } from '@/domain/entities/SupportTicket';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant-1';
const NOW = 1_000_000;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    name: 'María López',
    contactFormEnabled: false,
    calendarEnabled: false,
    links: [],
    createdAt: NOW,
    updatedAt: NOW,
    plan: 'free',
    planExpiredAt: null,
    ...overrides,
  };
}

function makeTicket(overrides: Partial<SupportTicket> = {}): SupportTicket {
  return {
    id: 'ticket-1',
    userId: 'user-1',
    type: 'error',
    status: 'open',
    title: 'Error al guardar',
    description: 'Falla al hacer clic en Guardar.',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeUserRepo(users: User[] = [makeUser()]): IUserRepository {
  return {
    findAll: vi.fn().mockResolvedValue(users),
    create: vi.fn(),
    createWithId: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findByUsername: vi.fn(),
    updateProfile: vi.fn(),
    updateContactFormEnabled: vi.fn(),
    updateCalendarEnabled: vi.fn(),
    updateUsername: vi.fn(),
    addLink: vi.fn(),
    updateLink: vi.fn(),
    deleteLink: vi.fn(),
    updateTheme: vi.fn(),
    updatePlan: vi.fn(),
    updateSubscriptionFlags: vi.fn(),
    updateLastVerificationEmailSentAt: vi.fn(),
  } as unknown as IUserRepository;
}

function makeTicketRepo(tickets: SupportTicket[] = [makeTicket()]): ISupportTicketRepository {
  return {
    findAllByTenant: vi.fn().mockResolvedValue(tickets),
    create: vi.fn(),
    findByUserId: vi.fn(),
    findOpenByType: vi.fn(),
    findByIdWithComments: vi.fn(),
    updateStatus: vi.fn(),
    addComment: vi.fn(),
  } as unknown as ISupportTicketRepository;
}

// ---------------------------------------------------------------------------
// GetSuperAdminStatsUseCase
// ---------------------------------------------------------------------------

describe('GetSuperAdminStatsUseCase', () => {
  it('returns correct total count for a single free user', async () => {
    const repo = makeUserRepo([makeUser()]);
    const result = await new GetSuperAdminStatsUseCase(repo).execute(TENANT_ID);
    expect(result.totalUsers).toBe(1);
    expect(result.usersWithActivePaidPlan).toBe(0);
  });

  it('counts pro user with no expiry as paid', async () => {
    const repo = makeUserRepo([makeUser({ plan: 'pro', planExpiredAt: null })]);
    const result = await new GetSuperAdminStatsUseCase(repo).execute(TENANT_ID);
    expect(result.usersWithActivePaidPlan).toBe(1);
  });

  it('counts team user with future expiry as paid', async () => {
    const repo = makeUserRepo([makeUser({ plan: 'team', planExpiredAt: Date.now() + 1_000_000 })]);
    const result = await new GetSuperAdminStatsUseCase(repo).execute(TENANT_ID);
    expect(result.usersWithActivePaidPlan).toBe(1);
  });

  it('does not count pro user with past expiry as paid', async () => {
    const repo = makeUserRepo([makeUser({ plan: 'pro', planExpiredAt: 1 })]);
    const result = await new GetSuperAdminStatsUseCase(repo).execute(TENANT_ID);
    expect(result.usersWithActivePaidPlan).toBe(0);
  });

  it('handles empty user list', async () => {
    const repo = makeUserRepo([]);
    const result = await new GetSuperAdminStatsUseCase(repo).execute(TENANT_ID);
    expect(result.totalUsers).toBe(0);
    expect(result.usersWithActivePaidPlan).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GetAllUsersUseCase
// ---------------------------------------------------------------------------

describe('GetAllUsersUseCase', () => {
  it('maps users to DTOs without sensitive fields', async () => {
    const user = makeUser({ plan: 'pro', links: [{ id: 'l1', title: 'Instagram', url: 'https://instagram.com/x' }] });
    const repo = makeUserRepo([user]);
    const result = await new GetAllUsersUseCase(repo).execute(TENANT_ID);

    expect(result).toHaveLength(1);
    expect(result[0].email).toBe(user.email);
    expect(result[0].plan).toBe('pro');
    expect(result[0].links).toHaveLength(1);
    // No sensitive fields
    expect((result[0] as Record<string, unknown>).stripeSubscriptionId).toBeUndefined();
    expect((result[0] as Record<string, unknown>).password).toBeUndefined();
  });

  it('includes updatedAt in the DTO', async () => {
    const user = makeUser({ updatedAt: 9999 });
    const repo = makeUserRepo([user]);
    const result = await new GetAllUsersUseCase(repo).execute(TENANT_ID);
    expect(result[0].updatedAt).toBe(9999);
  });

  it('sorts by createdAt descending', async () => {
    const users = [
      makeUser({ id: 'a', createdAt: 100, email: 'a@example.com' }),
      makeUser({ id: 'b', createdAt: 300, email: 'b@example.com' }),
      makeUser({ id: 'c', createdAt: 200, email: 'c@example.com' }),
    ];
    const repo = makeUserRepo(users);
    const result = await new GetAllUsersUseCase(repo).execute(TENANT_ID);
    expect(result[0].id).toBe('b');
    expect(result[1].id).toBe('c');
    expect(result[2].id).toBe('a');
  });
});

// ---------------------------------------------------------------------------
// GetAllTicketsUseCase
// ---------------------------------------------------------------------------

describe('GetAllTicketsUseCase', () => {
  it('enriches tickets with userEmail and userName', async () => {
    const user = makeUser({ id: 'user-1', email: 'owner@example.com', name: 'Juan Pérez' });
    const ticket = makeTicket({ userId: 'user-1' });
    const userRepo = makeUserRepo([user]);
    const ticketRepo = makeTicketRepo([ticket]);

    const result = await new GetAllTicketsUseCase(userRepo, ticketRepo).execute(TENANT_ID);

    expect(result).toHaveLength(1);
    expect(result[0].userEmail).toBe('owner@example.com');
    expect(result[0].userName).toBe('Juan Pérez');
  });

  it('uses fallback when userId has no matching user', async () => {
    const ticket = makeTicket({ userId: 'unknown-user' });
    const userRepo = makeUserRepo([makeUser({ id: 'other-user' })]);
    const ticketRepo = makeTicketRepo([ticket]);

    const result = await new GetAllTicketsUseCase(userRepo, ticketRepo).execute(TENANT_ID);

    expect(result[0].userEmail).toBe('(desconocido)');
    expect(result[0].userName).toBe('(desconocido)');
  });

  it('sorts tickets by createdAt descending', async () => {
    const tickets = [
      makeTicket({ id: 't1', createdAt: 100 }),
      makeTicket({ id: 't2', createdAt: 300 }),
      makeTicket({ id: 't3', createdAt: 200 }),
    ];
    const userRepo = makeUserRepo([makeUser()]);
    const ticketRepo = makeTicketRepo(tickets);

    const result = await new GetAllTicketsUseCase(userRepo, ticketRepo).execute(TENANT_ID);

    expect(result[0].id).toBe('t2');
    expect(result[1].id).toBe('t3');
    expect(result[2].id).toBe('t1');
  });

  it('returns empty array when no tickets exist', async () => {
    const userRepo = makeUserRepo([makeUser()]);
    const ticketRepo = makeTicketRepo([]);
    const result = await new GetAllTicketsUseCase(userRepo, ticketRepo).execute(TENANT_ID);
    expect(result).toHaveLength(0);
  });
});
