import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { UserResponseDto } from "../../domain/dtos/AuthDtos";
import { toUserResponse } from "./mappers";

export class GetProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(tenantId: string, userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(tenantId, userId);
    if (!user) {
      throw new Error("User not found");
    }
    return toUserResponse(user);
  }
}
