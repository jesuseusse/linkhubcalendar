import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { UserResponseDto } from "../../domain/dtos/AuthDtos";
import { toUserResponse } from "./mappers";

export class ToggleCalendarUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(tenantId: string, userId: string, enabled: boolean): Promise<UserResponseDto> {
    const user = await this.userRepository.updateCalendarEnabled(tenantId, userId, enabled);
    if (!user) {
      throw new Error("User not found");
    }
    return toUserResponse(user);
  }
}
