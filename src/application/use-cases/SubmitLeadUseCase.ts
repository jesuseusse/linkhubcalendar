import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { ILeadRepository } from "../../domain/interfaces/ILeadRepository";
import { IEmailSenderService, EmailSenderConfig } from "../../domain/interfaces/IEmailSenderService";
import { LeadResponseDto } from "../../domain/dtos/AuthDtos";

export class SubmitLeadUseCase {
  constructor(
    private userRepository: IUserRepository,
    private leadRepository: ILeadRepository,
    private emailSenderService?: IEmailSenderService | null,
    private emailConfig?: EmailSenderConfig | null,
    private dashboardUrl?: string | null,
    private companyName?: string | null
  ) {}

  async execute(
    tenantId: string,
    username: string,
    data: { name: string; email: string; phone: string; message: string }
  ): Promise<LeadResponseDto> {
    const user = await this.userRepository.findByUsername(tenantId, username);
    if (!user || !user.username) {
      throw new Error("User not found");
    }
    if (!user.contactFormEnabled) {
      throw new Error("Contact form is not enabled");
    }

    const lead = await this.leadRepository.create(tenantId, {
      userId: user.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
    });

    if (this.emailSenderService && this.emailConfig && this.dashboardUrl && user.email) {
      this.emailSenderService.sendContactNotification(
        this.emailConfig,
        user.email,
        { name: data.name, email: data.email, phone: data.phone, message: data.message },
        this.dashboardUrl,
        this.companyName ?? undefined
      ).catch(() => {});
    }

    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
      createdAt: lead.createdAt,
    };
  }
}
