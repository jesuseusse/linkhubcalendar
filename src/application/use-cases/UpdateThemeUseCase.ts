import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { UserResponseDto, UpdateThemeDto } from "../../domain/dtos/AuthDtos";
import { toUserResponse } from "./mappers";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export class UpdateThemeUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(tenantId: string, userId: string, dto: UpdateThemeDto): Promise<UserResponseDto> {
    const colors = [
      dto.backgroundColor,
      dto.textColor,
      dto.buttonColor,
      dto.buttonTextColor,
      dto.accentColor,
    ];

    for (const color of colors) {
      if (typeof color !== "string" || !HEX_COLOR_REGEX.test(color)) {
        throw new Error("All color values must be valid hex colors (e.g. #ff0000)");
      }
    }

    const user = await this.userRepository.updateTheme(tenantId, userId, {
      backgroundColor: dto.backgroundColor,
      textColor: dto.textColor,
      buttonColor: dto.buttonColor,
      buttonTextColor: dto.buttonTextColor,
      accentColor: dto.accentColor,
    });

    if (!user) {
      throw new Error("User not found");
    }

    return toUserResponse(user);
  }
}
