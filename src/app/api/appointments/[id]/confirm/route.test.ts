import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TENANT_ID = 'tenant-abc';
const USER_ID = 'user-123';
const APPOINTMENT_ID = 'appt-456';
const SLOT_ID = 'slot-789';

// ---------------------------------------------------------------------------
// Hoisted mock fns
// ---------------------------------------------------------------------------
const { mockCheckAuth, mockConfirmAppointment } = vi.hoisted(() => ({
  mockCheckAuth: vi.fn(),
  mockConfirmAppointment: vi.fn(),
}));

vi.mock('@/lib/auth/checkAuth', () => ({
  checkAuth: mockCheckAuth,
}));

vi.mock('@/infrastructure/container', () => ({
  container: {
    confirmAppointmentUseCase: { execute: mockConfirmAppointment },
  },
}));

import { PUT } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(appointmentId = APPOINTMENT_ID): NextRequest {
  return new NextRequest(
    `http://localhost/api/appointments/${appointmentId}/confirm`,
    { method: 'PUT' }
  );
}

function makeAppointment(status: string = 'pending', overrides: Record<string, unknown> = {}) {
  return {
    id: APPOINTMENT_ID,
    slotId: SLOT_ID,
    date: '2026-03-10',
    startTime: '10:00',
    endTime: '11:00',
    name: 'Ana García',
    email: 'ana@example.com',
    phone: '555-0100',
    reason: 'Consulta',
    status,
    createdAt: 1741000000000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PUT /api/appointments/[id]/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckAuth.mockResolvedValue({ userId: USER_ID, tenantId: TENANT_ID });
  });

  it('confirms a pending appointment and returns the updated record', async () => {
    const confirmed = makeAppointment('confirmed');
    mockConfirmAppointment.mockResolvedValue(confirmed);

    const res = await PUT(makeRequest(), { params: Promise.resolve({ id: APPOINTMENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('confirmed');
    expect(body.id).toBe(APPOINTMENT_ID);
    expect(mockConfirmAppointment).toHaveBeenCalledWith(TENANT_ID, USER_ID, APPOINTMENT_ID);
  });

  it('returns 400 when appointment is not found', async () => {
    mockConfirmAppointment.mockRejectedValue(new Error('Appointment not found'));

    const res = await PUT(makeRequest(), { params: Promise.resolve({ id: 'unknown-id' }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Appointment not found');
  });

  it('returns 400 when trying to confirm a cancelled appointment', async () => {
    mockConfirmAppointment.mockRejectedValue(new Error('Cannot confirm a cancelled appointment'));

    const res = await PUT(makeRequest(), { params: Promise.resolve({ id: APPOINTMENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Cannot confirm a cancelled appointment');
  });

  it('returns 400 when updateStatus fails', async () => {
    mockConfirmAppointment.mockRejectedValue(new Error('Failed to confirm appointment'));

    const res = await PUT(makeRequest(), { params: Promise.resolve({ id: APPOINTMENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Failed to confirm appointment');
  });

  it('returns 400 with generic message on unexpected error', async () => {
    mockConfirmAppointment.mockRejectedValue('unexpected');

    const res = await PUT(makeRequest(), { params: Promise.resolve({ id: APPOINTMENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Confirm failed');
  });

  it('propagates auth failure', async () => {
    mockCheckAuth.mockRejectedValue(new Error('Authentication required'));

    const res = await PUT(makeRequest(), { params: Promise.resolve({ id: APPOINTMENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Authentication required');
    expect(mockConfirmAppointment).not.toHaveBeenCalled();
  });
});
