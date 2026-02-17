export interface IEmailVerificationService {
  generateVerificationLink(tenantId: string, email: string): Promise<string>;
}
