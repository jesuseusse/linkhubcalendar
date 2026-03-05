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
const { mockCheckAuth, mockRescheduleAppointment } = vi.hoisted(() => ({
  mockCheckAuth: vi.fn(),
  mockRescheduleAppointment: vi.fn(),
}));

vi.mock('@/lib/auth/checkAuth', () => ({
  checkAuth: mockCheckAuth,
}));

vi.mock('@/infrastructure/container', () => ({
  container: {
    rescheduleAppointmentUseCase: { execute: mockRescheduleAppointment },
  },
}));

import { PUT } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(appointmentId = APPOINTMENT_ID): NextRequest {
  return new NextRequest(
    `http://localhost/api/appointments/${appointmentId}/reschedule`,
    { method: 'PUT' }
  );
}

function makeAppointment(status = 'pending') {
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
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PUT /api/appointments/[id]/reschedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckAuth.mockResolvedValue({ userId: USER_ID, tenantId: TENANT_ID });
  });

  it('reschedules a cancelled appointment and returns it as pending', async () => {
    const rescheduled = makeAppointment('pending');
    mockRescheduleAppointment.mockResolvedValue(rescheduled);

    const res = await PUT(makeRequest(), { params: Promise.resolve({ id: APPOINTMENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('pending');
    expect(body.id).toBe(APPOINTMENT_ID);
    expect(mockRescheduleAppointment).toHaveBeenCalledWith(TENANT_ID, USER_ID, APPOINTMENT_ID);
  });

  it('returns 409 when the slot is already booked by someone else', async () => {
    mockRescheduleAppointment.mockRejectedValue(new Error('Slot already booked'));

    const res = await PUT(makeRequest(), { params: Promise.resolve({ id: APPOINTMENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe('Slot already booked');
  });

  it('returns 400 when appointment is not found', async () => {
    mockRescheduleAppointment.mockRejectedValue(new Error('Appointment not found'));

    const res = await PUT(makeRequest(), { params: Promise.resolve({ id: 'unknown-id' }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Appointment not found');
  });

  it('returns 400 when appointment is not cancelled', async () => {
    mockRescheduleAppointment.mockRejectedValue(
      new Error('Only cancelled appointments can be rescheduled')
    );

    const res = await PUT(makeRequest(), { params: Promise.resolve({ id: APPOINTMENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Only cancelled appointments can be rescheduled');
  });

  it('returns 400 when the slot no longer exists', async () => {
    mockRescheduleAppointment.mockRejectedValue(new Error('Slot not found'));

    const res = await PUT(makeRequest(), { params: Promise.resolve({ id: APPOINTMENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Slot not found');
  });

  it('returns 400 on auth failure', async () => {
    mockCheckAuth.mockRejectedValue(new Error('Authentication required'));

    const res = await PUT(makeRequest(), { params: Promise.resolve({ id: APPOINTMENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Authentication required');
    expect(mockRescheduleAppointment).not.toHaveBeenCalled();
  });

  it('returns 400 with generic message on unexpected error', async () => {
    mockRescheduleAppointment.mockRejectedValue('unexpected');

    const res = await PUT(makeRequest(), { params: Promise.resolve({ id: APPOINTMENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Reschedule failed');
  });
});
