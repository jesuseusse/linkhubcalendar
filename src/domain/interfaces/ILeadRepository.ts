import { Lead, LeadStatus } from "../entities/Lead";

export type LeadOrder = 'recent' | 'older' | 'today';

export interface LeadQueryOptions {
  order: LeadOrder;
  status?: LeadStatus;
  cursor?: string;
  limit: number;
}

export interface PaginatedLeads {
  leads: Lead[];
  cursor: string | null;
  hasMore: boolean;
}

export interface ILeadRepository {
  create(tenantId: string, lead: Omit<Lead, "id" | "createdAt">): Promise<Lead>;
  findByUserId(tenantId: string, userId: string): Promise<Lead[]>;
  findByUserIdPaginated(tenantId: string, userId: string, opts: LeadQueryOptions): Promise<PaginatedLeads>;
  updateStatus(tenantId: string, leadId: string, userId: string, status: LeadStatus | null): Promise<Lead>;
}
