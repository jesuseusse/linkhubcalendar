import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { IAppointmentRepository } from "../../domain/interfaces/IAppointmentRepository";
import { UserResponseDto, CreateCalendarSlotDto } from "../../domain/dtos/AuthDtos";
import { toUserResponse } from "./mappers";

export class AddCalendarSlotUseCase {
  constructor(
    private userRepository: IUserRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(tenantId: string, userId: string, dto: CreateCalendarSlotDto): Promise<UserResponseDto> {
    if (!dto.date || !dto.startTime || !dto.endTime) {
      throw new Error("Date, start time, and end time are required");
    }

    if (dto.startTime >= dto.endTime) {
      throw new Error("Start time must be before end time");
    }

    const user = await this.userRepository.findById(tenantId, userId);
    if (!user) {
      throw new Error("User not found");
    }

    await this.appointmentRepository.addSlot(tenantId, userId, {
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      booked: false,
    });

    const slots = await this.appointmentRepository.findAllSlots(tenantId, userId);
    return toUserResponse(user, slots);
  }
}

export class UpsertCalendarSlotsUseCase {
  constructor(
    private userRepository: IUserRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(tenantId: string, userId: string, dtos: CreateCalendarSlotDto[]): Promise<UserResponseDto> {
    for (const dto of dtos) {
      if (!dto.date || !dto.startTime || !dto.endTime) {
        throw new Error("Date, start time, and end time are required");
      }
      if (dto.startTime >= dto.endTime) {
        throw new Error("Start time must be before end time");
      }
    }

    const user = await this.userRepository.findById(tenantId, userId);
    if (!user) {
      throw new Error("User not found");
    }

    await this.appointmentRepository.upsertSlots(
      tenantId,
      userId,
      dtos.map((dto) => ({ date: dto.date, startTime: dto.startTime, endTime: dto.endTime, booked: false }))
    );

    const slots = await this.appointmentRepository.findAllSlots(tenantId, userId);
    return toUserResponse(user, slots);
  }
}

export class DeleteCalendarSlotUseCase {
  constructor(
    private userRepository: IUserRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(tenantId: string, userId: string, slotId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(tenantId, userId);
    if (!user) {
      throw new Error("User not found");
    }

    await this.appointmentRepository.deleteSlot(tenantId, userId, slotId);
    const slots = await this.appointmentRepository.findAllSlots(tenantId, userId);
    return toUserResponse(user, slots);
  }
}

export class ReleaseCalendarSlotUseCase {
  constructor(
    private userRepository: IUserRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(tenantId: string, userId: string, slotId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(tenantId, userId);
    if (!user) {
      throw new Error("User or slot not found");
    }

    const slot = await this.appointmentRepository.findSlotById(tenantId, userId, slotId);
    if (!slot) {
      throw new Error("User or slot not found");
    }

    await this.appointmentRepository.upsertSlots(tenantId, userId, [
      { date: slot.date, startTime: slot.startTime, endTime: slot.endTime, booked: false },
    ]);

    const slots = await this.appointmentRepository.findAllSlots(tenantId, userId);
    return toUserResponse(user, slots);
  }
}

export class GetPublicCalendarUseCase {
  constructor(
    private userRepository: IUserRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(tenantId: string, username: string) {
    const user = await this.userRepository.findByUsername(tenantId, username);
    if (!user || !user.username) {
      throw new Error("Profile not found");
    }

    if (!user.calendarEnabled) {
      throw new Error("Calendar is not available");
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    const availableSlots = await this.appointmentRepository.findAvailableSlots(tenantId, user.id);

    const futureDateSlots = availableSlots.filter((slot) => slot.date >= todayStr);

    return {
      name: user.name,
      username: user.username,
      profilePhoto: user.profilePhoto,
      calendarSlots: futureDateSlots.map((slot) => ({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    };
  }
}
