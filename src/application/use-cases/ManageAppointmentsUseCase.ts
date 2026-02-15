import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { IAppointmentRepository } from "../../domain/interfaces/IAppointmentRepository";
import { AppointmentResponseDto } from "../../domain/dtos/AuthDtos";

export class DeleteAppointmentUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(tenantId: string, userId: string, appointmentId: string): Promise<void> {
    const appointment = await this.appointmentRepository.findById(tenantId, appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    if (appointment.userId !== userId) {
      throw new Error("Appointment not found");
    }

    await this.userRepository.updateCalendarSlotBooked(tenantId, userId, appointment.slotId, false);
    await this.appointmentRepository.deleteById(tenantId, appointmentId);
  }
}

export class ConfirmAppointmentUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(tenantId: string, userId: string, appointmentId: string): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findById(tenantId, appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    if (appointment.userId !== userId) {
      throw new Error("Appointment not found");
    }

    const updated = await this.appointmentRepository.updateStatus(tenantId, appointmentId, "confirmed");
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
      createdAt: updated.createdAt.toISOString(),
    };
  }
}

export class ReleaseAppointmentSlotUseCase {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(tenantId: string, userId: string, appointmentId: string): Promise<void> {
    const appointment = await this.appointmentRepository.findById(tenantId, appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    if (appointment.userId !== userId) {
      throw new Error("Appointment not found");
    }

    await this.userRepository.updateCalendarSlotBooked(tenantId, userId, appointment.slotId, false);
    await this.appointmentRepository.deleteById(tenantId, appointmentId);
  }
}
