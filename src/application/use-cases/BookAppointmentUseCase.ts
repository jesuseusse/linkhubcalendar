import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { IAppointmentRepository } from "../../domain/interfaces/IAppointmentRepository";
import { AppointmentResponseDto, CreateAppointmentDto } from "../../domain/dtos/AuthDtos";

export class BookAppointmentUseCase {
  constructor(
    private userRepository: IUserRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(
    tenantId: string,
    username: string,
    dto: CreateAppointmentDto
  ): Promise<AppointmentResponseDto> {
    const user = await this.userRepository.findByUsername(tenantId, username);
    if (!user || !user.username) {
      throw new Error("User not found");
    }
    if (!user.calendarEnabled) {
      throw new Error("Calendar is not enabled");
    }

    const slot = (user.calendarSlots || []).find((s) => s.id === dto.slotId);
    if (!slot) {
      throw new Error("Time slot not found");
    }

    if (slot.booked) {
      throw new Error("Time slot is already booked");
    }

    const appointment = await this.appointmentRepository.create(tenantId, {
      userId: user.id,
      slotId: dto.slotId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      reason: dto.reason,
      status: "pending",
    });

    await this.userRepository.updateCalendarSlotBooked(tenantId, user.id, dto.slotId, true);

    return {
      id: appointment.id,
      slotId: appointment.slotId,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      name: appointment.name,
      email: appointment.email,
      phone: appointment.phone,
      reason: appointment.reason,
      status: appointment.status,
      createdAt: appointment.createdAt.toISOString(),
    };
  }
}
