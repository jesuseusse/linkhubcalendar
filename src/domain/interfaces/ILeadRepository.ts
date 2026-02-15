import { Lead } from "../entities/Lead";

export interface ILeadRepository {
  create(tenantId: string, lead: Omit<Lead, "id" | "createdAt">): Promise<Lead>;
  findByUserId(tenantId: string, userId: string): Promise<Lead[]>;
}
