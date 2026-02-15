import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { IFileStorageService, FileInput } from "../../domain/interfaces/IFileStorageService";
import { UserResponseDto } from "../../domain/dtos/AuthDtos";
import { toUserResponse } from "./mappers";

export class UploadPhotoUseCase {
  constructor(
    private userRepository: IUserRepository,
    private fileStorageService: IFileStorageService
  ) {}

  async execute(tenantId: string, userId: string, file: FileInput): Promise<UserResponseDto> {
    const currentUser = await this.userRepository.findById(tenantId, userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    if (currentUser.profilePhoto) {
      await this.fileStorageService.deleteFile(tenantId, currentUser.profilePhoto);
    }

    const filePath = await this.fileStorageService.saveFile(tenantId, file);

    const user = await this.userRepository.updateProfile(tenantId, userId, { profilePhoto: filePath });
    if (!user) {
      throw new Error("User not found");
    }

    return toUserResponse(user);
  }
}
