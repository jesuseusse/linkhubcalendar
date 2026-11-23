import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CancelAppointmentUseCase, RescheduleAppointmentUseCase } from './ManageAppointmentsUseCase';
import { IAppointmentRepository } from '../../domain/interfaces/IAppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment';

const TENANT = 'tenant-1';
const USER = 'user-1';

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    type: 'appointment',
    id: '20260720_0900',
    userId: USER,
    slotId: '20260720_0900',
    date: '2026-07-20',
    startTime: '09:00',
    endTime: '09:30',
    name: 'Ana',
    email: 'ana@example.com',
    phone: '555',
    reason: 'Consulta',
    status: 'pending',
    createdAt: 1,
    ...overrides,
  };
}

describe('CancelAppointmentUseCase', () => {
  let repo: { findById: ReturnType<typeof vi.fn>; releaseSlotAtomically: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repo = { findById: vi.fn(), releaseSlotAtomically: vi.fn() };
  });

  it('releases the slot and returns the cancelled appointment (new id when archived)', async () => {
    repo.findById.mockResolvedValue(makeAppointment());
    repo.releaseSlotAtomically.mockResolvedValue(makeAppointment({ id: 'archived-1', status: 'cancelled' }));

    const result = await new CancelAppointmentUseCase(repo as unknown as IAppointmentRepository).execute(
      TENANT, USER, '20260720_0900'
    );

    expect(repo.releaseSlotAtomically).toHaveBeenCalledWith(TENANT, USER, '20260720_0900', '20260720_0900');
    expect(result.status).toBe('cancelled');
    expect(result.id).toBe('archived-1');
  });

  it('rejects an already cancelled appointment', async () => {
    repo.findById.mockResolvedValue(makeAppointment({ status: 'cancelled' }));
    await expect(
      new CancelAppointmentUseCase(repo as unknown as IAppointmentRepository).execute(TENANT, USER, 'x')
    ).rejects.toThrow('already cancelled');
    expect(repo.releaseSlotAtomically).not.toHaveBeenCalled();
  });
});

describe('RescheduleAppointmentUseCase', () => {
  let repo: { findById: ReturnType<typeof vi.fn>; markSlotBookedAtomically: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repo = { findById: vi.fn(), markSlotBookedAtomically: vi.fn() };
  });

  it('re-takes the slot and returns the appointment as pending', async () => {
    repo.findById.mockResolvedValue(makeAppointment({ id: 'archived-1', status: 'cancelled' }));
    repo.markSlotBookedAtomically.mockResolvedValue(makeAppointment({ status: 'pending' }));

    const result = await new RescheduleAppointmentUseCase(repo as unknown as IAppointmentRepository).execute(
      TENANT, USER, 'archived-1'
    );

    expect(repo.markSlotBookedAtomically).toHaveBeenCalledWith(TENANT, USER, 'archived-1', '20260720_0900');
    expect(result.status).toBe('pending');
  });

  it('propagates "Slot already booked" when someone else took the slot', async () => {
    repo.findById.mockResolvedValue(makeAppointment({ id: 'archived-1', status: 'cancelled' }));
    repo.markSlotBookedAtomically.mockRejectedValue(new Error('Slot already booked'));

    await expect(
      new RescheduleAppointmentUseCase(repo as unknown as IAppointmentRepository).execute(TENANT, USER, 'archived-1')
    ).rejects.toThrow('Slot already booked');
  });

  it('rejects appointments that are not cancelled', async () => {
    repo.findById.mockResolvedValue(makeAppointment({ status: 'confirmed' }));
    await expect(
      new RescheduleAppointmentUseCase(repo as unknown as IAppointmentRepository).execute(TENANT, USER, 'x')
    ).rejects.toThrow('Only cancelled');
    expect(repo.markSlotBookedAtomically).not.toHaveBeenCalled();
  });
});
