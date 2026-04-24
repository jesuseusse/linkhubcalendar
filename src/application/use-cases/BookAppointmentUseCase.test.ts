import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookAppointmentUseCase } from './BookAppointmentUseCase';
import type { IUserRepository } from '@/domain/interfaces/IUserRepository';
import type { IAppointmentRepository } from '@/domain/interfaces/IAppointmentRepository';
import type { IEmailSenderService } from '@/domain/interfaces/IEmailSenderService';
import type { User } from '@/domain/entities/User';
import type { Appointment } from '@/domain/entities/Appointment';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const TENANT_ID = 'tenant-1';
const USERNAME = 'juanita';
const USER_ID = 'user-42';
const SLOT_ID = 'slot-99';
const APPOINTMENT_ID = 'appt-77';
const DASHBOARD_URL = 'https://example.com/u/admin/dashboard/dates';
const EMAIL_CONFIG = { tenantId: TENANT_ID, apiKey: 'key', fromEmail: 'no-reply@example.com' };

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: USER_ID,
    email: 'owner@example.com',
    name: 'Juanita Pérez',
    username: USERNAME,
    contactFormEnabled: false,
    calendarEnabled: true,
    links: [],
    plan: 'pro',
    createdAt: 1_000_000,
    updatedAt: 1_000_000,
    ...overrides,
  };
}

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    type: 'appointment',
    id: APPOINTMENT_ID,
    userId: USER_ID,
    slotId: SLOT_ID,
    date: '2026-04-01',
    startTime: '10:00',
    endTime: '11:00',
    name: 'Pedro Visitante',
    email: 'pedro@example.com',
    phone: '555-1234',
    reason: 'Consulta general',
    status: 'pending',
    createdAt: 2_000_000,
    ...overrides,
  };
}

const DTO = {
  slotId: SLOT_ID,
  name: 'Pedro Visitante',
  email: 'pedro@example.com',
  phone: '555-1234',
  reason: 'Consulta general',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('BookAppointmentUseCase', () => {
  let userRepo: IUserRepository;
  let appointmentRepo: IAppointmentRepository;
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

    appointmentRepo = {
      bookSlotAtomically: vi.fn().mockResolvedValue(makeAppointment()),
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findBySlotId: vi.fn(),
      deleteById: vi.fn(),
      updateStatus: vi.fn(),
      addSlot: vi.fn(),
      upsertSlots: vi.fn(),
      findAllSlots: vi.fn(),
      findAvailableSlots: vi.fn(),
      findSlotById: vi.fn(),
      deleteSlot: vi.fn(),
      releaseSlotAtomically: vi.fn(),
      markSlotBookedAtomically: vi.fn(),
    } as IAppointmentRepository;

    emailSenderService = {
      sendVerificationEmail: vi.fn(),
      sendAppointmentNotification: vi.fn().mockResolvedValue(undefined),
      sendUpcomingRenewalEmail: vi.fn().mockResolvedValue(undefined),
      sendContactNotification: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe('happy path — with email notification', () => {
    it('returns the booked appointment DTO', async () => {
      const useCase = new BookAppointmentUseCase(
        userRepo, appointmentRepo, emailSenderService, EMAIL_CONFIG, DASHBOARD_URL, 'Mi Empresa'
      );

      const result = await useCase.execute(TENANT_ID, USERNAME, DTO);

      expect(result).toMatchObject({
        id: APPOINTMENT_ID,
        slotId: SLOT_ID,
        date: '2026-04-01',
        startTime: '10:00',
        endTime: '11:00',
        name: 'Pedro Visitante',
        email: 'pedro@example.com',
        status: 'pending',
      });
    });

    it('calls bookSlotAtomically with correct args', async () => {
      const useCase = new BookAppointmentUseCase(
        userRepo, appointmentRepo, emailSenderService, EMAIL_CONFIG, DASHBOARD_URL
      );

      await useCase.execute(TENANT_ID, USERNAME, DTO);

      expect(appointmentRepo.bookSlotAtomically).toHaveBeenCalledWith(
        TENANT_ID,
        USER_ID,
        SLOT_ID,
        { userId: USER_ID, name: DTO.name, email: DTO.email, phone: DTO.phone, reason: DTO.reason }
      );
    });

    it('sends appointment notification email to the owner', async () => {
      const useCase = new BookAppointmentUseCase(
        userRepo, appointmentRepo, emailSenderService, EMAIL_CONFIG, DASHBOARD_URL, 'Mi Empresa'
      );

      await useCase.execute(TENANT_ID, USERNAME, DTO);

      // Allow the fire-and-forget promise to settle
      await vi.waitFor(() =>
        expect(emailSenderService.sendAppointmentNotification).toHaveBeenCalledOnce()
      );

      expect(emailSenderService.sendAppointmentNotification).toHaveBeenCalledWith(
        EMAIL_CONFIG,
        'owner@example.com',
        {
          name: 'Pedro Visitante',
          email: 'pedro@example.com',
          phone: '555-1234',
          reason: 'Consulta general',
          date: '2026-04-01',
          startTime: '10:00',
          endTime: '11:00',
        },
        DASHBOARD_URL,
        'Mi Empresa'
      );
    });
  });

  describe('happy path — without email notification', () => {
    it('books successfully when no email service is provided', async () => {
      const useCase = new BookAppointmentUseCase(userRepo, appointmentRepo);

      const result = await useCase.execute(TENANT_ID, USERNAME, DTO);

      expect(result.id).toBe(APPOINTMENT_ID);
      expect(appointmentRepo.bookSlotAtomically).toHaveBeenCalledOnce();
    });

    it('does not call sendAppointmentNotification when email service is null', async () => {
      const useCase = new BookAppointmentUseCase(userRepo, appointmentRepo, null, null, null);

      await useCase.execute(TENANT_ID, USERNAME, DTO);

      expect(emailSenderService.sendAppointmentNotification).not.toHaveBeenCalled();
    });

    it('does not call sendAppointmentNotification when owner has no email', async () => {
      vi.mocked(userRepo.findByUsername).mockResolvedValue(makeUser({ email: undefined }));

      const useCase = new BookAppointmentUseCase(
        userRepo, appointmentRepo, emailSenderService, EMAIL_CONFIG, DASHBOARD_URL
      );

      await useCase.execute(TENANT_ID, USERNAME, DTO);

      expect(emailSenderService.sendAppointmentNotification).not.toHaveBeenCalled();
    });
  });

  describe('email failure is swallowed', () => {
    it('still returns the appointment when notification email throws', async () => {
      vi.mocked(emailSenderService.sendAppointmentNotification).mockRejectedValue(
        new Error('SMTP error')
      );

      const useCase = new BookAppointmentUseCase(
        userRepo, appointmentRepo, emailSenderService, EMAIL_CONFIG, DASHBOARD_URL
      );

      const result = await useCase.execute(TENANT_ID, USERNAME, DTO);

      expect(result.id).toBe(APPOINTMENT_ID);
    });
  });

  describe('error cases', () => {
    it('throws when user is not found', async () => {
      vi.mocked(userRepo.findByUsername).mockResolvedValue(null);

      const useCase = new BookAppointmentUseCase(userRepo, appointmentRepo);

      await expect(useCase.execute(TENANT_ID, USERNAME, DTO)).rejects.toThrow('User not found');
      expect(appointmentRepo.bookSlotAtomically).not.toHaveBeenCalled();
    });

    it('throws when calendar is disabled', async () => {
      vi.mocked(userRepo.findByUsername).mockResolvedValue(makeUser({ calendarEnabled: false }));

      const useCase = new BookAppointmentUseCase(userRepo, appointmentRepo);

      await expect(useCase.execute(TENANT_ID, USERNAME, DTO)).rejects.toThrow('Calendar is not enabled');
      expect(appointmentRepo.bookSlotAtomically).not.toHaveBeenCalled();
    });

    it('throws when slot is already booked', async () => {
      vi.mocked(appointmentRepo.bookSlotAtomically).mockRejectedValue(
        new Error('Time slot is already booked')
      );

      const useCase = new BookAppointmentUseCase(userRepo, appointmentRepo);

      await expect(useCase.execute(TENANT_ID, USERNAME, DTO)).rejects.toThrow('Time slot is already booked');
    });
  });
});
