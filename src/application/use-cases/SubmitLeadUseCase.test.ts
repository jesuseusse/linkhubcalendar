import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmitLeadUseCase } from './SubmitLeadUseCase';
import type { IUserRepository } from '@/domain/interfaces/IUserRepository';
import type { ILeadRepository } from '@/domain/interfaces/ILeadRepository';
import type { IEmailSenderService } from '@/domain/interfaces/IEmailSenderService';
import type { User } from '@/domain/entities/User';
import type { Lead } from '@/domain/entities/Lead';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const TENANT_ID = 'tenant-1';
const USERNAME = 'juanita';
const USER_ID = 'user-42';
const LEAD_ID = 'lead-11';
const DASHBOARD_URL = 'https://example.com/u/admin/dashboard/leads';
const EMAIL_CONFIG = { tenantId: TENANT_ID, apiKey: 'key', fromEmail: 'no-reply@example.com' };

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: USER_ID,
    email: 'owner@example.com',
    name: 'Juanita Pérez',
    username: USERNAME,
    contactFormEnabled: true,
    calendarEnabled: false,
    galleryEnabled: false,
    galleryPhotos: [],
    links: [],
    plan: 'pro',
    createdAt: 1_000_000,
    updatedAt: 1_000_000,
    ...overrides,
  };
}

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: LEAD_ID,
    userId: USER_ID,
    name: 'Pedro Visitante',
    email: 'pedro@example.com',
    phone: '555-1234',
    message: 'Hola, me interesa su servicio',
    createdAt: 2_000_000,
    ...overrides,
  };
}

const FORM_DATA = {
  name: 'Pedro Visitante',
  email: 'pedro@example.com',
  phone: '555-1234',
  message: 'Hola, me interesa su servicio',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('SubmitLeadUseCase', () => {
  let userRepo: IUserRepository;
  let leadRepo: ILeadRepository;
  let emailSenderService: IEmailSenderService;

  beforeEach(() => {
    userRepo = {
      findByUsername: vi.fn().mockResolvedValue(makeUser()),
      findById: vi.fn(),
      create: vi.fn(),
      createWithId: vi.fn(),
      findByEmail: vi.fn(),
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

    leadRepo = {
      create: vi.fn().mockResolvedValue(makeLead()),
      findByUserId: vi.fn(),
      findByUserIdPaginated: vi.fn(),
      updateStatus: vi.fn(),
    } as ILeadRepository;

    emailSenderService = {
      sendVerificationEmail: vi.fn(),
      sendAppointmentNotification: vi.fn(),
      sendUpcomingRenewalEmail: vi.fn(),
      sendContactNotification: vi.fn().mockResolvedValue(undefined),
      sendSupportTicketNotification: vi.fn(),
      sendCampaignEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      sendStripeWebhookErrorNotification: vi.fn(),
    };
  });

  describe('happy path — with email notification', () => {
    it('returns the created lead DTO', async () => {
      const useCase = new SubmitLeadUseCase(
        userRepo, leadRepo, emailSenderService, EMAIL_CONFIG, DASHBOARD_URL, 'Mi Empresa'
      );

      const result = await useCase.execute(TENANT_ID, USERNAME, FORM_DATA);

      expect(result).toMatchObject({
        id: LEAD_ID,
        name: 'Pedro Visitante',
        email: 'pedro@example.com',
      });
    });

    it('calls leadRepo.create with correct data', async () => {
      const useCase = new SubmitLeadUseCase(userRepo, leadRepo);

      await useCase.execute(TENANT_ID, USERNAME, FORM_DATA);

      expect(leadRepo.create).toHaveBeenCalledWith(TENANT_ID, {
        userId: USER_ID,
        name: FORM_DATA.name,
        email: FORM_DATA.email,
        phone: FORM_DATA.phone,
        message: FORM_DATA.message,
      });
    });

    it('sends contact notification email to the owner', async () => {
      const useCase = new SubmitLeadUseCase(
        userRepo, leadRepo, emailSenderService, EMAIL_CONFIG, DASHBOARD_URL, 'Mi Empresa'
      );

      await useCase.execute(TENANT_ID, USERNAME, FORM_DATA);

      // Allow the fire-and-forget promise to settle
      await vi.waitFor(() =>
        expect(emailSenderService.sendContactNotification).toHaveBeenCalledOnce()
      );

      expect(emailSenderService.sendContactNotification).toHaveBeenCalledWith(
        EMAIL_CONFIG,
        'owner@example.com',
        FORM_DATA,
        DASHBOARD_URL,
        'Mi Empresa'
      );
    });
  });

  describe('happy path — without email notification', () => {
    it('creates lead successfully when no email service is provided', async () => {
      const useCase = new SubmitLeadUseCase(userRepo, leadRepo);

      const result = await useCase.execute(TENANT_ID, USERNAME, FORM_DATA);

      expect(result.id).toBe(LEAD_ID);
      expect(leadRepo.create).toHaveBeenCalledOnce();
    });

    it('does not call sendContactNotification when email service is null', async () => {
      const useCase = new SubmitLeadUseCase(userRepo, leadRepo, null, null, null);

      await useCase.execute(TENANT_ID, USERNAME, FORM_DATA);

      expect(emailSenderService.sendContactNotification).not.toHaveBeenCalled();
    });

    it('does not call sendContactNotification when owner has no email', async () => {
      vi.mocked(userRepo.findByUsername).mockResolvedValue(makeUser({ email: undefined }));

      const useCase = new SubmitLeadUseCase(
        userRepo, leadRepo, emailSenderService, EMAIL_CONFIG, DASHBOARD_URL
      );

      await useCase.execute(TENANT_ID, USERNAME, FORM_DATA);

      expect(emailSenderService.sendContactNotification).not.toHaveBeenCalled();
    });
  });

  describe('email failure is swallowed', () => {
    it('still returns the lead when notification email throws', async () => {
      vi.mocked(emailSenderService.sendContactNotification).mockRejectedValue(
        new Error('SMTP error')
      );

      const useCase = new SubmitLeadUseCase(
        userRepo, leadRepo, emailSenderService, EMAIL_CONFIG, DASHBOARD_URL
      );

      const result = await useCase.execute(TENANT_ID, USERNAME, FORM_DATA);

      expect(result.id).toBe(LEAD_ID);
    });
  });

  describe('error cases', () => {
    it('throws when user is not found', async () => {
      vi.mocked(userRepo.findByUsername).mockResolvedValue(null);

      const useCase = new SubmitLeadUseCase(userRepo, leadRepo);

      await expect(useCase.execute(TENANT_ID, USERNAME, FORM_DATA)).rejects.toThrow('User not found');
      expect(leadRepo.create).not.toHaveBeenCalled();
    });

    it('throws when contact form is disabled', async () => {
      vi.mocked(userRepo.findByUsername).mockResolvedValue(makeUser({ contactFormEnabled: false }));

      const useCase = new SubmitLeadUseCase(userRepo, leadRepo);

      await expect(useCase.execute(TENANT_ID, USERNAME, FORM_DATA)).rejects.toThrow('Contact form is not enabled');
      expect(leadRepo.create).not.toHaveBeenCalled();
    });
  });
});
