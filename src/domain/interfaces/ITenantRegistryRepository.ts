import { TenantRegistryData } from '@/interfaces/ITenantRegistryData';

export interface CreateTenantRegistryData {
  tenantId: string;
  domain?: string | null;
  companyName?: string | null;
  logoUrl?: string | null;
  resendApiKey?: string | null;
  resendFromEmail?: string | null;
  theme?: Record<string, string> | null;
}

export interface ITenantRegistryRepository {
  getByHostname(hostname: string): Promise<TenantRegistryData | null>;
  getByTenantId(tenantId: string): Promise<TenantRegistryData | null>;
  updateByHostname(hostname: string, data: Partial<CreateTenantRegistryData>): Promise<TenantRegistryData>;
  create(hostname: string, data: CreateTenantRegistryData): Promise<TenantRegistryData>;
}
