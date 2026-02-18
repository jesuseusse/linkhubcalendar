import { IUserRepository } from '@/domain/interfaces/IUserRepository';
import { IEmailVerificationService } from '@/domain/interfaces/IEmailVerificationService';
import { IEmailSenderService, EmailSenderConfig } from '@/domain/interfaces/IEmailSenderService';

const COOLDOWN_SECONDS = 120;

export interface SendEmailVerificationInput {
  tenantId: string;
  userId: string;
  emailConfig: EmailSenderConfig;
  companyName?: string;
}

export class SendEmailVerificationUseCase {
  constructor(
    private userRepository: IUserRepository,
    private emailVerificationService: IEmailVerificationService,
    private emailSenderService: IEmailSenderService
  ) {}

  async execute(input: SendEmailVerificationInput): Promise<{ sentAt: number }> {
    const { tenantId, userId, emailConfig, companyName } = input;

    const user = await this.userRepository.findById(tenantId, userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.lastVerificationEmailSentAt) {
      const elapsed = (Date.now() - user.lastVerificationEmailSentAt) / 1000;
      if (elapsed < COOLDOWN_SECONDS) {
        const remaining = Math.ceil(COOLDOWN_SECONDS - elapsed);
        throw new Error(`Debes esperar ${remaining} segundos antes de reenviar`);
      }
    }

    const verificationLink = await this.emailVerificationService.generateVerificationLink(
      tenantId,
      user.email
    );

    await this.emailSenderService.sendVerificationEmail(
      emailConfig,
      user.email,
      verificationLink,
      companyName ?? undefined
    );

    await this.userRepository.updateLastVerificationEmailSentAt(tenantId, userId);

    return { sentAt: Date.now() };
  }
}
