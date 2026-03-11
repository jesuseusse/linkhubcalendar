import { IAppointmentRepository } from "../../domain/interfaces/IAppointmentRepository";
import { AppointmentResponseDto } from "../../domain/dtos/AuthDtos";

function toDto(appt: import("../../domain/entities/Appointment").Appointment): AppointmentResponseDto {
  return {
    id: appt.id,
    slotId: appt.slotId,
    date: appt.date,
    startTime: appt.startTime,
    endTime: appt.endTime,
    name: appt.name,
    email: appt.email,
    phone: appt.phone,
    reason: appt.reason,
    status: appt.status,
    createdAt: appt.createdAt,
  };
}

export class CancelAppointmentUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(tenantId: string, userId: string, appointmentId: string): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findById(tenantId, userId, appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    if (appointment.userId !== userId) {
      throw new Error("Appointment not found");
    }
    if (appointment.status === "cancelled") {
      throw new Error("Appointment is already cancelled");
    }

    // Atomically: update appointment status to cancelled + release slot
    await this.appointmentRepository.releaseSlotAtomically(
      tenantId,
      userId,
      appointmentId,
      appointment.slotId
    );

    const updated = await this.appointmentRepository.findById(tenantId, userId, appointmentId);
    if (!updated) {
      throw new Error("Failed to cancel appointment");
    }
    return toDto(updated);
  }
}

export class RescheduleAppointmentUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(tenantId: string, userId: string, appointmentId: string): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findById(tenantId, userId, appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    if (appointment.userId !== userId) {
      throw new Error("Appointment not found");
    }
    if (appointment.status !== "cancelled") {
      throw new Error("Only cancelled appointments can be rescheduled");
    }

    // Atomically: mark slot booked + set appointment status to pending
    // markSlotBookedAtomically validates slot exists and is not already booked
    await this.appointmentRepository.markSlotBookedAtomically(
      tenantId,
      userId,
      appointmentId,
      appointment.slotId
    );

    const updated = await this.appointmentRepository.findById(tenantId, userId, appointmentId);
    if (!updated) {
      throw new Error("Failed to reschedule appointment");
    }
    return toDto(updated);
  }
}

export class ConfirmAppointmentUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(tenantId: string, userId: string, appointmentId: string): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findById(tenantId, userId, appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    if (appointment.userId !== userId) {
      throw new Error("Appointment not found");
    }
    if (appointment.status === "cancelled") {
      throw new Error("Cannot confirm a cancelled appointment");
    }

    const updated = await this.appointmentRepository.updateStatus(tenantId, userId, appointmentId, "confirmed");
    if (!updated) {
      throw new Error("Failed to confirm appointment");
    }
    return toDto(updated);
  }
}
