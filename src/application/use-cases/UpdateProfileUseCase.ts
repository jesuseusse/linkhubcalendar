import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { UserResponseDto, UpdateProfileDto } from "../../domain/dtos/AuthDtos";
import { toUserResponse } from "./mappers";

export class UpdateProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(tenantId: string, userId: string, dto: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.userRepository.updateProfile(tenantId, userId, dto);
    if (!user) {
      throw new Error("User not found");
    }
    return toUserResponse(user);
  }
}
