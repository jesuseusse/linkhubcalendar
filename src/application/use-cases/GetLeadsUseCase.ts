import { ILeadRepository } from "../../domain/interfaces/ILeadRepository";
import { LeadResponseDto } from "../../domain/dtos/AuthDtos";

export class GetLeadsUseCase {
  constructor(private leadRepository: ILeadRepository) {}

  async execute(tenantId: string, userId: string): Promise<LeadResponseDto[]> {
    const leads = await this.leadRepository.findByUserId(tenantId, userId);
    return leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      message: lead.message,
      createdAt: lead.createdAt,
    }));
  }
}
