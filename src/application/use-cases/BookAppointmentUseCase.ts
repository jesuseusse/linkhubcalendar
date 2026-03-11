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

    // Atomic transaction: reads slot, validates !booked, creates appointment, marks slot booked
    const appointment = await this.appointmentRepository.bookSlotAtomically(
      tenantId,
      user.id,
      dto.slotId,
      {
        userId: user.id,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        reason: dto.reason,
      }
    );

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
      createdAt: appointment.createdAt,
    };
  }
}
