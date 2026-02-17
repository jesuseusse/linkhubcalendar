import { IUserRepository } from '@/domain/interfaces/IUserRepository';
import { IEmailVerificationService } from '@/domain/interfaces/IEmailVerificationService';

export class SendEmailVerificationUseCase {
  constructor(
    private userRepository: IUserRepository,
    private emailVerificationService: IEmailVerificationService
  ) {}

  async execute(tenantId: string, userId: string): Promise<{ verificationLink: string }> {
    const user = await this.userRepository.findById(tenantId, userId);
    if (!user) {
      throw new Error('User not found');
    }

    const verificationLink = await this.emailVerificationService.generateVerificationLink(
      tenantId,
      user.email
    );

    return { verificationLink };
  }
}
