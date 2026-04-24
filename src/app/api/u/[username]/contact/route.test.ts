import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TENANT_ID = 'tenant-abc';
const HOSTNAME = 'example.com';
const USERNAME = 'juanita';
const LEAD_ID = 'lead-11';

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

const MOCK_LEAD = {
  id: LEAD_ID,
  name: 'Pedro Visitante',
  email: 'pedro@example.com',
  phone: '555-1234',
  message: 'Hola',
  createdAt: 2_000_000,
};

// ---------------------------------------------------------------------------
// Hoisted mock fns
// ---------------------------------------------------------------------------
const {
  mockResolveTenantRegistry,
  mockResolveEffectiveHostname,
  mockCreateEmailSenderService,
  mockSubmitLeadExecute,
  MockSubmitLeadUseCase,
} = vi.hoisted(() => {
  const mockSubmitLeadExecute = vi.fn();
  // Must use a regular function (not arrow) so `new MockSubmitLeadUseCase()` works
  const MockSubmitLeadUseCase = vi.fn(function () {
    return { execute: mockSubmitLeadExecute };
  });
  return {
    mockResolveTenantRegistry: vi.fn(),
    mockResolveEffectiveHostname: vi.fn(),
    mockCreateEmailSenderService: vi.fn(),
    mockSubmitLeadExecute,
    MockSubmitLeadUseCase,
  };
});

vi.mock('@/lib/auth/resolveTenantId', () => ({
  resolveTenantRegistry: mockResolveTenantRegistry,
  resolveEffectiveHostname: mockResolveEffectiveHostname,
}));

vi.mock('@/infrastructure/services/emailSenderFactory', () => ({
  createEmailSenderService: mockCreateEmailSenderService,
}));

vi.mock('@/application/use-cases/SubmitLeadUseCase', () => ({
  SubmitLeadUseCase: MockSubmitLeadUseCase,
}));

vi.mock('@/infrastructure/container', () => ({
  userRepo: {},
  leadRepo: {},
}));

import { POST } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest(`http://${HOSTNAME}/api/u/${USERNAME}/contact`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: HOSTNAME },
    body: JSON.stringify({
      name: 'Pedro Visitante',
      email: 'pedro@example.com',
      phone: '555-1234',
      message: 'Hola',
      ...body,
    }),
  });
}

const MOCK_EMAIL_SENDER = {
  sendVerificationEmail: vi.fn(),
  sendAppointmentNotification: vi.fn(),
  sendUpcomingRenewalEmail: vi.fn(),
  sendContactNotification: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/u/[username]/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveTenantRegistry.mockResolvedValue(MOCK_REGISTRY);
    mockResolveEffectiveHostname.mockReturnValue(HOSTNAME);
    mockCreateEmailSenderService.mockReturnValue(MOCK_EMAIL_SENDER);
    mockSubmitLeadExecute.mockResolvedValue(MOCK_LEAD);
  });

  describe('happy path — email configured', () => {
    it('returns 201 with success on valid submission', async () => {
      const res = await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });

      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({ success: true });
    });

    it('instantiates SubmitLeadUseCase with email sender and leads dashboard URL', async () => {
      await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });

      expect(MockSubmitLeadUseCase).toHaveBeenCalledWith(
        {},             // userRepo
        {},             // leadRepo
        MOCK_EMAIL_SENDER,
        { tenantId: TENANT_ID, apiKey: 'resend-key', fromEmail: 'no-reply@example.com' },
        `https://${HOSTNAME}/u/admin/dashboard/leads`,
        'Mi Empresa'
      );
    });

    it('calls use-case execute with resolved tenantId and username', async () => {
      await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });

      expect(mockSubmitLeadExecute).toHaveBeenCalledWith(
        TENANT_ID,
        USERNAME,
        expect.objectContaining({ name: 'Pedro Visitante' })
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

    it('instantiates SubmitLeadUseCase with null email deps when service unavailable', async () => {
      mockCreateEmailSenderService.mockImplementation(() => {
        throw new Error('Servicio de correo no configurado para este tenant');
      });

      await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });

      expect(MockSubmitLeadUseCase).toHaveBeenCalledWith(
        {},
        {},
        null,
        null,
        `https://${HOSTNAME}/u/admin/dashboard/leads`,
        'Mi Empresa'
      );
    });
  });

  describe('error cases', () => {
    it('returns 400 when contact form is disabled', async () => {
      mockSubmitLeadExecute.mockRejectedValue(new Error('Contact form is not enabled'));

      const res = await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Contact form is not enabled');
    });

    it('returns 400 when user is not found', async () => {
      mockSubmitLeadExecute.mockRejectedValue(new Error('User not found'));

      const res = await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('User not found');
    });

    it('returns 400 with generic message on unexpected error', async () => {
      mockSubmitLeadExecute.mockRejectedValue('unexpected');

      const res = await POST(makeRequest(), { params: Promise.resolve({ username: USERNAME }) });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Submission failed');
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
