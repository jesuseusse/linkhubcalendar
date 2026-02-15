import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { CreateLinkDto, UpdateLinkDto, UserResponseDto } from "../../domain/dtos/AuthDtos";
import { toUserResponse } from "./mappers";

export class AddLinkUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(tenantId: string, userId: string, dto: CreateLinkDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.findById(tenantId, userId);
    if (!existing) {
      throw new Error("User not found");
    }
    if (existing.links.some((l) => l.title.toLowerCase() === dto.title.toLowerCase())) {
      throw new Error("A link with this name already exists");
    }
    if (existing.links.some((l) => l.url.toLowerCase() === dto.url.toLowerCase())) {
      throw new Error("A link with this URL already exists");
    }
    const user = await this.userRepository.addLink(tenantId, userId, dto);
    if (!user) {
      throw new Error("User not found");
    }
    return toUserResponse(user);
  }
}

export class UpdateLinkUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(tenantId: string, userId: string, linkId: string, dto: UpdateLinkDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.findById(tenantId, userId);
    if (!existing) {
      throw new Error("User not found");
    }
    const otherLinks = existing.links.filter((l) => l.id !== linkId);
    if (otherLinks.some((l) => l.title.toLowerCase() === dto.title.toLowerCase())) {
      throw new Error("A link with this name already exists");
    }
    if (otherLinks.some((l) => l.url.toLowerCase() === dto.url.toLowerCase())) {
      throw new Error("A link with this URL already exists");
    }
    const user = await this.userRepository.updateLink(tenantId, userId, linkId, dto);
    if (!user) {
      throw new Error("User or link not found");
    }
    return toUserResponse(user);
  }
}

export class DeleteLinkUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(tenantId: string, userId: string, linkId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.deleteLink(tenantId, userId, linkId);
    if (!user) {
      throw new Error("User or link not found");
    }
    return toUserResponse(user);
  }
}
