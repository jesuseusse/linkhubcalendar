import { IAppointmentRepository } from "../../domain/interfaces/IAppointmentRepository";
import { PaginatedAppointmentsDto } from "../../domain/dtos/AuthDtos";

export class GetAppointmentsUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(tenantId: string, userId: string, page: number, limit: number): Promise<PaginatedAppointmentsDto> {
    const { appointments, total } = await this.appointmentRepository.findByUserId(tenantId, userId, page, limit);

    return {
      appointments: appointments.map((a) => ({
        id: a.id,
        slotId: a.slotId,
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        name: a.name,
        email: a.email,
        phone: a.phone,
        reason: a.reason,
        status: a.status || "pending",
        createdAt: a.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
