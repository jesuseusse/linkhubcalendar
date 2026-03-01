import { ILeadRepository } from "../../domain/interfaces/ILeadRepository";
import { LeadStatus } from "../../domain/entities/Lead";
import { LeadResponseDto } from "../../domain/dtos/AuthDtos";

export class UpdateLeadStatusUseCase {
  constructor(private leadRepository: ILeadRepository) {}

  async execute(
    tenantId: string,
    leadId: string,
    userId: string,
    status: LeadStatus | null
  ): Promise<LeadResponseDto> {
    const lead = await this.leadRepository.updateStatus(tenantId, leadId, userId, status);
    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
      status: lead.status,
      createdAt: lead.createdAt,
    };
  }
}
