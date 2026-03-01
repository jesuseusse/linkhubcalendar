import { ILeadRepository, LeadQueryOptions } from "../../domain/interfaces/ILeadRepository";
import { PaginatedLeadsResponseDto, LeadResponseDto } from "../../domain/dtos/AuthDtos";

function toDto(lead: { id: string; name: string; email: string; phone: string; message: string; status?: import("../../domain/entities/Lead").LeadStatus; createdAt: number }): LeadResponseDto {
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

export class GetLeadsPaginatedUseCase {
  constructor(private leadRepository: ILeadRepository) {}

  async execute(
    tenantId: string,
    userId: string,
    opts: Omit<LeadQueryOptions, 'limit'> & { limit?: number }
  ): Promise<PaginatedLeadsResponseDto> {
    const result = await this.leadRepository.findByUserIdPaginated(tenantId, userId, {
      ...opts,
      limit: opts.limit ?? 25,
    });
    return {
      leads: result.leads.map(toDto),
      cursor: result.cursor,
      hasMore: result.hasMore,
    };
  }
}
