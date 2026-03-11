import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TENANT_ID = 'tenant-abc';
const HOSTNAME = 'example.com';
const USERNAME = 'juanita';
const APPOINTMENT_ID = 'appt-77';
const SLOT_ID = 'slot-99';

const MOCK_REGISTRY = {
  tenantId: TENANT_ID,
  domain: HOSTNAME,
  companyName: 'Mi Empresa',
  resendApiKey: 'resend-key',
  resendFromEmail: 'no-reply@example.com',
  sesConfig: null,
  theme: null,
  logoUrl: null,
};

const MOCK_APPOINTMENT = {
  id: APPOINTMENT_ID,
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
};

// ---------------------------------------------------------------------------
// Hoisted mock fns
// ---------------------------------------------------------------------------
const {
  mockResolveTenantRegistry,
  mockResolveEffectiveHostname,
  mockCreateEmailSenderService,
  mockBookAppointmentExecute,
  MockBookAppointmentUseCase,
} = vi.hoisted(() => {
  const mockBookAppointmentExecute = vi.fn();
  // Must use a regular function (not arrow) so `new MockBookAppointmentUseCase()` works
  const MockBookAppointmentUseCase = vi.fn(function () {
    return { execute: mockBookAppointmentExecute };
  });
  return {
    mockResolveTenantRegistry: vi.fn(),
    mockResolveEffectiveHostname: vi.fn(),
    mockCreateEmailSenderService: vi.fn(),
    mockBookAppointmentExecute,
    MockBookAppointmentUseCase,
  };
});

vi.mock('@/lib/auth/resolveTenantId', () => ({
  resolveTenantRegistry: mockResolveTenantRegistry,
  resolveEffectiveHostname: mockResolveEffectiveHostname,
}));

vi.mock('@/infrastructure/services/emailSenderFactory', () => ({
  createEmailSenderService: mockCreateEmailSenderService,
}));

vi.mock('@/application/use-cases/BookAppointmentUseCase', () => ({
  BookAppointmentUseCase: MockBookAppointmentUseCase,
}));

vi.mock('@/infrastructure/container', () => ({
  userRepo: {},
  appointmentRepo: {},
}));

import { POST } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest(`http://${HOSTNAME}/api/u/${USERNAME}/appointments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: HOSTNAME },
    body: JSON.stringify({ slotId: SLOT_ID, name: 'Pedro Visitante', email: 'pedro@example.com', phone: '555-1234', reason: 'Consulta general', ...body }),
  });
}

const MOCK_EMAIL_SENDER = { sendVerificationEmail: vi.fn(), sendAppointmentNotification: vi.fn() };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/u/[username]/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveTenantRegistry.mockResolvedValue(MOCK_REGISTRY);
    mockResolveEffectiveHostname.mockReturnValue(HOSTNAME);
    mockCreateEmailSenderService.mockReturnValue(MOCK_EMAIL_SENDER);
    mockBookAppointmentExecute.mockResolvedValue(MOCK_APPOINTMENT);
  });

  describe('happy path — email configured', () => {
    it('returns 201 with the booked appointment', async () => {
      const res = await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body).toMatchObject({ id: APPOINTMENT_ID, status: 'pending' });
    });

    it('instantiates BookAppointmentUseCase with email sender and dashboard URL', async () => {
      await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });

      expect(MockBookAppointmentUseCase).toHaveBeenCalledWith(
        {},                     // userRepo
        {},                     // appointmentRepo
        MOCK_EMAIL_SENDER,
        { tenantId: TENANT_ID, apiKey: 'resend-key', fromEmail: 'no-reply@example.com' },
        `https://${HOSTNAME}/tenants/${HOSTNAME}/u/admin/dashboard/dates`,
        'Mi Empresa'
      );
    });

    it('calls use-case execute with resolved tenantId and username', async () => {
      await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });

      expect(mockBookAppointmentExecute).toHaveBeenCalledWith(
        TENANT_ID,
        USERNAME,
        expect.objectContaining({ slotId: SLOT_ID })
      );
    });
  });

  describe('happy path — email not configured', () => {
    it('returns 201 even when createEmailSenderService throws', async () => {
      mockCreateEmailSenderService.mockImplementation(() => {
        throw new Error('Servicio de correo no configurado para este tenant');
      });

      const res = await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });

      expect(res.status).toBe(201);
    });

    it('instantiates BookAppointmentUseCase with null email deps when service unavailable', async () => {
      mockCreateEmailSenderService.mockImplementation(() => {
        throw new Error('Servicio de correo no configurado para este tenant');
      });

      await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });

      expect(MockBookAppointmentUseCase).toHaveBeenCalledWith(
        {},
        {},
        null,
        null,
        `https://${HOSTNAME}/tenants/${HOSTNAME}/u/admin/dashboard/dates`,
        'Mi Empresa'
      );
    });
  });

  describe('error cases', () => {
    it('returns 400 when slot is already booked', async () => {
      mockBookAppointmentExecute.mockRejectedValue(new Error('Time slot is already booked'));

      const res = await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Time slot is already booked');
    });

    it('returns 400 when user is not found', async () => {
      mockBookAppointmentExecute.mockRejectedValue(new Error('User not found'));

      const res = await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('User not found');
    });

    it('returns 400 with generic message on unexpected error', async () => {
      mockBookAppointmentExecute.mockRejectedValue('unexpected');

      const res = await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Booking failed');
    });

    it('returns 400 when tenant registry is not found', async () => {
      mockResolveTenantRegistry.mockRejectedValue(new Error('Domain not authorized'));

      const res = await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Domain not authorized');
    });
  });
});
