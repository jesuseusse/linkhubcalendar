import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { IAppointmentRepository } from "../../domain/interfaces/IAppointmentRepository";
import { UserResponseDto } from "../../domain/dtos/AuthDtos";
import { toUserResponse } from "./mappers";

export class GetProfileUseCase {
  constructor(
    private userRepository: IUserRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(tenantId: string, userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(tenantId, userId);
    if (!user) {
      throw new Error("User not found");
    }
    const slots = await this.appointmentRepository.findAllSlots(tenantId, userId);
    return toUserResponse(user, slots);
  }
}
