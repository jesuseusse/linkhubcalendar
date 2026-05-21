import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CreateSupportTicketUseCase,
  GetSupportTicketsUseCase,
  GetTicketDetailUseCase,
  UpdateTicketStatusUseCase,
  AddCommentUseCase,
} from './ManageSupportTicketsUseCase';
import type { ISupportTicketRepository } from '@/domain/interfaces/ISupportTicketRepository';
import type { IEmailSenderService } from '@/domain/interfaces/IEmailSenderService';
import type { SupportTicket, TicketComment } from '@/domain/entities/SupportTicket';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-42';
const TICKET_ID = 'ticket-99';
const USER_EMAIL = 'owner@example.com';
const USER_NAME = 'María López';
const EMAIL_CONFIG = { tenantId: TENANT_ID, apiKey: 'key', fromEmail: 'no-reply@example.com' };

function makeTicket(overrides: Partial<SupportTicket> = {}): SupportTicket {
  return {
    id: TICKET_ID,
    userId: USER_ID,
    type: 'error',
    status: 'open',
    title: 'Error al guardar cambios',
    description: 'Cuando hago clic en Guardar no pasa nada.',
    createdAt: 1_000_000,
    updatedAt: 1_000_000,
    ...overrides,
  };
}

function makeComment(overrides: Partial<TicketComment> = {}): TicketComment {
  return {
    id: 'comment-1',
    ticketId: TICKET_ID,
    userId: USER_ID,
    userName: USER_NAME,
    userEmail: USER_EMAIL,
    content: 'Gracias por reportarlo, lo revisamos.',
    createdAt: 2_000_000,
    ...overrides,
  };
}

function makeSupportTicketRepo(): ISupportTicketRepository {
  return {
    create: vi.fn().mockResolvedValue(makeTicket()),
    findByUserId: vi.fn().mockResolvedValue([makeTicket()]),
    findOpenByType: vi.fn().mockResolvedValue(null),
    findByIdWithComments: vi.fn().mockResolvedValue({ ticket: makeTicket(), comments: [] }),
    updateStatus: vi.fn().mockResolvedValue(makeTicket({ status: 'closed' })),
    addComment: vi.fn().mockResolvedValue(makeComment()),
  };
}

function makeEmailService(): IEmailSenderService {
  return {
    sendVerificationEmail: vi.fn(),
    sendAppointmentNotification: vi.fn(),
    sendUpcomingRenewalEmail: vi.fn(),
    sendContactNotification: vi.fn(),
    sendSupportTicketNotification: vi.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// CreateSupportTicketUseCase
// ---------------------------------------------------------------------------

describe('CreateSupportTicketUseCase', () => {
  let repo: ISupportTicketRepository;
  let emailService: IEmailSenderService;

  beforeEach(() => {
    repo = makeSupportTicketRepo();
    emailService = makeEmailService();
    vi.stubEnv('NEXT_SUPER_ADMINS_EMAILS', 'admin@example.com');
  });

  it('happy path — creates error ticket and returns DTO', async () => {
    const useCase = new CreateSupportTicketUseCase(repo);
    const result = await useCase.execute(TENANT_ID, USER_ID, USER_EMAIL, USER_NAME, {
      type: 'error',
      title: 'Error al guardar cambios',
      description: 'Cuando hago clic en Guardar no pasa nada.',
    });

    expect(result.id).toBe(TICKET_ID);
    expect(result.type).toBe('error');
    expect(result.status).toBe('open');
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it('happy path — creates suggestion ticket and returns DTO', async () => {
    const suggestTicket = makeTicket({ type: 'suggestion', title: 'Modo oscuro' });
    vi.mocked(repo.create).mockResolvedValue(suggestTicket);

    const useCase = new CreateSupportTicketUseCase(repo);
    const result = await useCase.execute(TENANT_ID, USER_ID, USER_EMAIL, USER_NAME, {
      type: 'suggestion',
      title: 'Modo oscuro',
      description: 'Sería genial tener modo oscuro.',
    });

    expect(result.type).toBe('suggestion');
    expect(repo.create).toHaveBeenCalledWith(
      TENANT_ID,
      expect.objectContaining({ type: 'suggestion', status: 'open' })
    );
  });

  it('sends admin email notification when email service is configured', async () => {
    vi.mocked(repo.create).mockResolvedValue(
      makeTicket({ title: 'Test', description: 'Test desc' })
    );
    const useCase = new CreateSupportTicketUseCase(repo, emailService, EMAIL_CONFIG, 'Mi Empresa');
    await useCase.execute(TENANT_ID, USER_ID, USER_EMAIL, USER_NAME, {
      type: 'error',
      title: 'Test',
      description: 'Test desc',
    });

    await vi.waitFor(() =>
      expect(emailService.sendSupportTicketNotification).toHaveBeenCalledOnce()
    );

    expect(emailService.sendSupportTicketNotification).toHaveBeenCalledWith(
      EMAIL_CONFIG,
      ['admin@example.com'],
      expect.objectContaining({ title: 'Test', type: 'error', userEmail: USER_EMAIL }),
      'Mi Empresa'
    );
  });

  it('blocks creating a second open ticket of the same type', async () => {
    vi.mocked(repo.findOpenByType).mockResolvedValue(makeTicket());

    const useCase = new CreateSupportTicketUseCase(repo);
    await expect(
      useCase.execute(TENANT_ID, USER_ID, USER_EMAIL, USER_NAME, {
        type: 'error',
        title: 'Otro error',
        description: 'Descripción.',
      })
    ).rejects.toThrow('Ya tienes un reporte de error abierto');

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('error ticket with deviceType not "other" — repo not called with deviceOther key', async () => {
    const useCase = new CreateSupportTicketUseCase(repo);
    await useCase.execute(TENANT_ID, USER_ID, USER_EMAIL, USER_NAME, {
      type: 'error',
      title: 'App crash',
      description: 'Crashes on launch.',
      deviceType: 'android',
    });

    const [, ticketArg] = vi.mocked(repo.create).mock.calls[0];
    expect(ticketArg.deviceType).toBe('android');
    expect(ticketArg).not.toHaveProperty('deviceOther');
  });

  it('error ticket with deviceType "other" — deviceOther included in repo call', async () => {
    const useCase = new CreateSupportTicketUseCase(repo);
    await useCase.execute(TENANT_ID, USER_ID, USER_EMAIL, USER_NAME, {
      type: 'error',
      title: 'App crash',
      description: 'Crashes on launch.',
      deviceType: 'other',
      deviceOther: 'Huawei P30',
    });

    const [, ticketArg] = vi.mocked(repo.create).mock.calls[0];
    expect(ticketArg.deviceType).toBe('other');
    expect(ticketArg.deviceOther).toBe('Huawei P30');
  });

  it('repo create is never called with undefined-valued fields (Firestore guard)', async () => {
    const useCase = new CreateSupportTicketUseCase(repo);
    await useCase.execute(TENANT_ID, USER_ID, USER_EMAIL, USER_NAME, {
      type: 'error',
      title: 'Test',
      description: 'Test',
      deviceType: 'ios',
    });

    const [, ticketArg] = vi.mocked(repo.create).mock.calls[0];
    const undefinedKeys = Object.entries(ticketArg)
      .filter(([, v]) => v === undefined)
      .map(([k]) => k);
    expect(undefinedKeys).toEqual([]);
  });

  it('passes screenshotUrl to repo when provided', async () => {
    const useCase = new CreateSupportTicketUseCase(repo);
    await useCase.execute(
      TENANT_ID, USER_ID, USER_EMAIL, USER_NAME,
      { type: 'error', title: 'Test', description: 'Test' },
      'https://storage.example.com/screenshot.webp'
    );

    const [, ticketArg] = vi.mocked(repo.create).mock.calls[0];
    expect(ticketArg.screenshotUrl).toBe('https://storage.example.com/screenshot.webp');
  });

  it('does not include screenshotUrl in repo call when not provided', async () => {
    const useCase = new CreateSupportTicketUseCase(repo);
    await useCase.execute(TENANT_ID, USER_ID, USER_EMAIL, USER_NAME, {
      type: 'error',
      title: 'Test',
      description: 'Test',
    });

    const [, ticketArg] = vi.mocked(repo.create).mock.calls[0];
    expect(ticketArg).not.toHaveProperty('screenshotUrl');
  });

  it('passes whatsappPhone to repo when provided', async () => {
    const useCase = new CreateSupportTicketUseCase(repo);
    await useCase.execute(TENANT_ID, USER_ID, USER_EMAIL, USER_NAME, {
      type: 'suggestion',
      title: 'Dark mode',
      description: 'Would love dark mode.',
      whatsappPhone: '+52 55 1234 5678',
    });

    const [, ticketArg] = vi.mocked(repo.create).mock.calls[0];
    expect(ticketArg.whatsappPhone).toBe('+52 55 1234 5678');
  });

  it('suggestion ticket — repo payload has no deviceType or deviceOther', async () => {
    vi.mocked(repo.create).mockResolvedValue(makeTicket({ type: 'suggestion' }));

    const useCase = new CreateSupportTicketUseCase(repo);
    await useCase.execute(TENANT_ID, USER_ID, USER_EMAIL, USER_NAME, {
      type: 'suggestion',
      title: 'Dark mode',
      description: 'Would love dark mode.',
    });

    const [, ticketArg] = vi.mocked(repo.create).mock.calls[0];
    expect(ticketArg).not.toHaveProperty('deviceType');
    expect(ticketArg).not.toHaveProperty('deviceOther');
    expect(ticketArg.type).toBe('suggestion');
  });

  it('suggestion ticket with screenshot and whatsapp — no undefined values in repo call', async () => {
    vi.mocked(repo.create).mockResolvedValue(makeTicket({ type: 'suggestion' }));

    const useCase = new CreateSupportTicketUseCase(repo);
    await useCase.execute(
      TENANT_ID, USER_ID, USER_EMAIL, USER_NAME,
      { type: 'suggestion', title: 'Mejora', description: 'Una mejora.', whatsappPhone: '+52 55 9999 0000' },
      'https://storage.example.com/suggestion.webp'
    );

    const [, ticketArg] = vi.mocked(repo.create).mock.calls[0];
    const undefinedKeys = Object.entries(ticketArg)
      .filter(([, v]) => v === undefined)
      .map(([k]) => k);
    expect(undefinedKeys).toEqual([]);
    expect(ticketArg.screenshotUrl).toBe('https://storage.example.com/suggestion.webp');
    expect(ticketArg.whatsappPhone).toBe('+52 55 9999 0000');
  });

  it('email failure does not prevent ticket creation', async () => {
    vi.mocked(emailService.sendSupportTicketNotification).mockRejectedValue(
      new Error('SMTP error')
    );
    const useCase = new CreateSupportTicketUseCase(repo, emailService, EMAIL_CONFIG);
    const result = await useCase.execute(TENANT_ID, USER_ID, USER_EMAIL, USER_NAME, {
      type: 'error',
      title: 'Test',
      description: 'Test',
    });

    expect(result.id).toBe(TICKET_ID);
  });
});

// ---------------------------------------------------------------------------
// GetSupportTicketsUseCase
// ---------------------------------------------------------------------------

describe('GetSupportTicketsUseCase', () => {
  it('happy path — returns ticket list', async () => {
    const repo = makeSupportTicketRepo();
    const useCase = new GetSupportTicketsUseCase(repo);

    const result = await useCase.execute(TENANT_ID, USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(TICKET_ID);
    expect(repo.findByUserId).toHaveBeenCalledWith(TENANT_ID, USER_ID);
  });
});

// ---------------------------------------------------------------------------
// GetTicketDetailUseCase
// ---------------------------------------------------------------------------

describe('GetTicketDetailUseCase', () => {
  it('happy path — returns ticket with empty comment list', async () => {
    const repo = makeSupportTicketRepo();
    const useCase = new GetTicketDetailUseCase(repo);

    const result = await useCase.execute(TENANT_ID, USER_ID, TICKET_ID);

    expect(result.ticket.id).toBe(TICKET_ID);
    expect(result.comments).toHaveLength(0);
  });

  it('throws when ticket does not exist', async () => {
    const repo = makeSupportTicketRepo();
    vi.mocked(repo.findByIdWithComments).mockResolvedValue(null);
    const useCase = new GetTicketDetailUseCase(repo);

    await expect(useCase.execute(TENANT_ID, USER_ID, TICKET_ID)).rejects.toThrow('Ticket not found');
  });
});

// ---------------------------------------------------------------------------
// UpdateTicketStatusUseCase
// ---------------------------------------------------------------------------

describe('UpdateTicketStatusUseCase', () => {
  it('happy path — updates status and returns updated DTO', async () => {
    const repo = makeSupportTicketRepo();
    const useCase = new UpdateTicketStatusUseCase(repo);

    const result = await useCase.execute(TENANT_ID, USER_ID, TICKET_ID, 'closed');

    expect(result.status).toBe('closed');
    expect(repo.updateStatus).toHaveBeenCalledWith(TENANT_ID, USER_ID, TICKET_ID, 'closed');
  });
});

// ---------------------------------------------------------------------------
// AddCommentUseCase
// ---------------------------------------------------------------------------

describe('AddCommentUseCase', () => {
  it('happy path — adds comment to an open ticket', async () => {
    const repo = makeSupportTicketRepo();
    vi.mocked(repo.addComment).mockResolvedValue(
      makeComment({ content: 'Gracias por el reporte.' })
    );
    const useCase = new AddCommentUseCase(repo);

    const result = await useCase.execute(
      TENANT_ID,
      USER_ID,
      TICKET_ID,
      'Gracias por el reporte.',
      USER_NAME,
      USER_EMAIL
    );

    expect(result.content).toBe('Gracias por el reporte.');
    expect(repo.addComment).toHaveBeenCalledOnce();
  });

  it('throws when ticket is not open', async () => {
    const repo = makeSupportTicketRepo();
    vi.mocked(repo.findByIdWithComments).mockResolvedValue({
      ticket: makeTicket({ status: 'closed' }),
      comments: [],
    });
    const useCase = new AddCommentUseCase(repo);

    await expect(
      useCase.execute(TENANT_ID, USER_ID, TICKET_ID, 'Comentario', USER_NAME, USER_EMAIL)
    ).rejects.toThrow('Solo se pueden agregar comentarios a tickets abiertos');

    expect(repo.addComment).not.toHaveBeenCalled();
  });

  it('throws when ticket does not exist', async () => {
    const repo = makeSupportTicketRepo();
    vi.mocked(repo.findByIdWithComments).mockResolvedValue(null);
    const useCase = new AddCommentUseCase(repo);

    await expect(
      useCase.execute(TENANT_ID, USER_ID, TICKET_ID, 'Hola', USER_NAME, USER_EMAIL)
    ).rejects.toThrow('Ticket not found');
  });
});
