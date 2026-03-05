import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { IAppointmentRepository } from "../../domain/interfaces/IAppointmentRepository";
import { AppointmentResponseDto } from "../../domain/dtos/AuthDtos";

export class CancelAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private userRepository: IUserRepository
  ) {}

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

    // Release the slot so it can be booked by another person
    await this.userRepository.updateCalendarSlotBooked(tenantId, userId, appointment.slotId, false);

    // Mark as cancelled (record is kept for audit purposes)
    const updated = await this.appointmentRepository.updateStatus(tenantId, userId, appointmentId, "cancelled");
    if (!updated) {
      throw new Error("Failed to cancel appointment");
    }

    return {
      id: updated.id,
      slotId: updated.slotId,
      date: updated.date,
      startTime: updated.startTime,
      endTime: updated.endTime,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      reason: updated.reason,
      status: updated.status,
      createdAt: updated.createdAt,
    };
  }
}

export class RescheduleAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private userRepository: IUserRepository
  ) {}

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

    const user = await this.userRepository.findById(tenantId, userId);
    if (!user) {
      throw new Error("User not found");
    }

    const slot = (user.calendarSlots ?? []).find(s => s.id === appointment.slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }
    if (slot.booked) {
      throw new Error("Slot already booked");
    }

    await this.userRepository.updateCalendarSlotBooked(tenantId, userId, appointment.slotId, true);
    const updated = await this.appointmentRepository.updateStatus(tenantId, userId, appointmentId, "pending");
    if (!updated) {
      throw new Error("Failed to reschedule appointment");
    }

    return {
      id: updated.id,
      slotId: updated.slotId,
      date: updated.date,
      startTime: updated.startTime,
      endTime: updated.endTime,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      reason: updated.reason,
      status: updated.status,
      createdAt: updated.createdAt,
    };
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

    return {
      id: updated.id,
      slotId: updated.slotId,
      date: updated.date,
      startTime: updated.startTime,
      endTime: updated.endTime,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      reason: updated.reason,
      status: updated.status,
      createdAt: updated.createdAt,
    };
  }
}
