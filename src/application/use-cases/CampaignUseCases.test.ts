import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SendCampaignUseCase, GetCampaignsPaginatedUseCase, GetCampaignDetailUseCase } from './CampaignUseCases';
import type { ICampaignRepository } from '@/domain/interfaces/ICampaignRepository';
import type { IEmailSenderService, EmailSenderConfig } from '@/domain/interfaces/IEmailSenderService';
import type { Campaign } from '@/domain/entities/Campaign';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant-1';
const APP_BASE = 'https://app.example.com';
const EMAIL_CONFIG: EmailSenderConfig = {
  tenantId: TENANT_ID,
  apiKey: 'key-123',
  fromEmail: 'no-reply@example.com',
};

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'campaign-1',
    subject: 'Nuevas funciones',
    htmlBody: '<p>Hola</p>',
    recipients: ['a@example.com', 'b@example.com'],
    status: 'draft',
    createdAt: 1_000_000,
    stats: { totalRecipients: 2, clicksCount: 0 },
    ...overrides,
  };
}

function makeCampaignRepo(): ICampaignRepository {
  return {
    create: vi.fn().mockResolvedValue(makeCampaign()),
    findById: vi.fn().mockResolvedValue(makeCampaign()),
    findPaginated: vi.fn().mockResolvedValue({ campaigns: [makeCampaign()], cursor: null, hasMore: false }),
    markSent: vi.fn().mockResolvedValue(undefined),
    incrementClicks: vi.fn().mockResolvedValue(undefined),
    recordClick: vi.fn().mockResolvedValue(undefined),
  };
}

function makeEmailService(): IEmailSenderService {
  return {
    sendVerificationEmail: vi.fn(),
    sendAppointmentNotification: vi.fn(),
    sendUpcomingRenewalEmail: vi.fn(),
    sendContactNotification: vi.fn(),
    sendSupportTicketNotification: vi.fn(),
    sendCampaignEmail: vi.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// SendCampaignUseCase
// ---------------------------------------------------------------------------

describe('SendCampaignUseCase', () => {
  let repo: ICampaignRepository;
  let emailService: IEmailSenderService;

  beforeEach(() => {
    repo = makeCampaignRepo();
    emailService = makeEmailService();
  });

  it('throws when email service is not configured', async () => {
    const useCase = new SendCampaignUseCase(repo, null, null, APP_BASE);
    await expect(
      useCase.execute(TENANT_ID, { subject: 'Test', htmlBody: '<p>hi</p>', recipientEmails: ['a@x.com'] })
    ).rejects.toThrow('Servicio de correo no configurado');
  });

  it('throws when recipients list is empty', async () => {
    const useCase = new SendCampaignUseCase(repo, emailService, EMAIL_CONFIG, APP_BASE);
    await expect(
      useCase.execute(TENANT_ID, { subject: 'Test', htmlBody: '<p>hi</p>', recipientEmails: [] })
    ).rejects.toThrow('No hay destinatarios');
  });

  it('throws when recipients exceed 200', async () => {
    const useCase = new SendCampaignUseCase(repo, emailService, EMAIL_CONFIG, APP_BASE);
    const tooMany = Array.from({ length: 201 }, (_, i) => `user${i}@example.com`);
    await expect(
      useCase.execute(TENANT_ID, { subject: 'Test', htmlBody: '<p>hi</p>', recipientEmails: tooMany })
    ).rejects.toThrow('Máximo');
  });

  it('deduplicates recipients', async () => {
    const useCase = new SendCampaignUseCase(repo, emailService, EMAIL_CONFIG, APP_BASE);
    await useCase.execute(TENANT_ID, {
      subject: 'Test',
      htmlBody: '<p>hi</p>',
      recipientEmails: ['a@x.com', 'a@x.com', 'b@x.com'],
    });
    // sendCampaignEmail called once per unique recipient
    expect(emailService.sendCampaignEmail).toHaveBeenCalledTimes(2);
  });

  it('calls sendCampaignEmail for each recipient and marks sent', async () => {
    const useCase = new SendCampaignUseCase(repo, emailService, EMAIL_CONFIG, APP_BASE);
    const result = await useCase.execute(TENANT_ID, {
      subject: 'Promo',
      htmlBody: '<p>Descuento</p>',
      recipientEmails: ['a@x.com', 'b@x.com'],
    });
    expect(emailService.sendCampaignEmail).toHaveBeenCalledTimes(2);
    expect(repo.markSent).toHaveBeenCalledWith(TENANT_ID, 'campaign-1', expect.any(Number));
    expect(result.failedCount).toBe(0);
  });

  it('collects failed sends without throwing, still marks sent', async () => {
    vi.mocked(emailService.sendCampaignEmail).mockRejectedValueOnce(new Error('SMTP error'));
    const useCase = new SendCampaignUseCase(repo, emailService, EMAIL_CONFIG, APP_BASE);
    const result = await useCase.execute(TENANT_ID, {
      subject: 'Promo',
      htmlBody: '<p>Descuento</p>',
      recipientEmails: ['fail@x.com', 'ok@x.com'],
    });
    expect(result.failedCount).toBe(1);
    expect(repo.markSent).toHaveBeenCalled();
  });

  it('injects tracking links into the HTML before sending', async () => {
    const htmlBody = '<a href="https://mysite.com/deal">Ver oferta</a>';
    const useCase = new SendCampaignUseCase(repo, emailService, EMAIL_CONFIG, APP_BASE);
    await useCase.execute(TENANT_ID, {
      subject: 'Test',
      htmlBody,
      recipientEmails: ['user@x.com'],
    });
    const callArg = vi.mocked(emailService.sendCampaignEmail).mock.calls[0][3];
    expect(callArg).toContain('/api/track?r=');
    expect(callArg).not.toContain('href="https://mysite.com/deal"');
  });
});

// ---------------------------------------------------------------------------
// GetCampaignsPaginatedUseCase
// ---------------------------------------------------------------------------

describe('GetCampaignsPaginatedUseCase', () => {
  it('delegates to repo and maps to DTOs', async () => {
    const repo = makeCampaignRepo();
    const useCase = new GetCampaignsPaginatedUseCase(repo);
    const result = await useCase.execute(TENANT_ID, { limit: 10 });
    expect(repo.findPaginated).toHaveBeenCalledWith(TENANT_ID, { limit: 10 });
    expect(result.campaigns).toHaveLength(1);
    expect(result.hasMore).toBe(false);
    expect(result.cursor).toBeNull();
  });

  it('forwards cursor to repo', async () => {
    const repo = makeCampaignRepo();
    const useCase = new GetCampaignsPaginatedUseCase(repo);
    await useCase.execute(TENANT_ID, { cursor: 'abc', limit: 5 });
    expect(repo.findPaginated).toHaveBeenCalledWith(TENANT_ID, { cursor: 'abc', limit: 5 });
  });
});

// ---------------------------------------------------------------------------
// GetCampaignDetailUseCase
// ---------------------------------------------------------------------------

describe('GetCampaignDetailUseCase', () => {
  it('returns the campaign DTO', async () => {
    const repo = makeCampaignRepo();
    const useCase = new GetCampaignDetailUseCase(repo);
    const result = await useCase.execute(TENANT_ID, 'campaign-1');
    expect(result.id).toBe('campaign-1');
    expect(result.subject).toBe('Nuevas funciones');
  });

  it('throws when campaign is not found', async () => {
    const repo = makeCampaignRepo();
    vi.mocked(repo.findById).mockResolvedValue(null);
    const useCase = new GetCampaignDetailUseCase(repo);
    await expect(useCase.execute(TENANT_ID, 'missing-id')).rejects.toThrow('Campaña no encontrada');
  });
});
