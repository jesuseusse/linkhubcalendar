import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { ILeadRepository } from "../../domain/interfaces/ILeadRepository";
import { LeadResponseDto } from "../../domain/dtos/AuthDtos";

export class SubmitLeadUseCase {
  constructor(
    private userRepository: IUserRepository,
    private leadRepository: ILeadRepository
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
