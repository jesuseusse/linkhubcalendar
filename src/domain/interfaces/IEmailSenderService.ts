export interface EmailSenderConfig {
  tenantId: string;
  apiKey: string;
  fromEmail: string;
}

export interface IEmailSenderService {
  sendVerificationEmail(
    config: EmailSenderConfig,
    to: string,
    verificationLink: string,
    companyName?: string
  ): Promise<void>;
}
