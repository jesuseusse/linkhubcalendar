import { TenantRegistryData } from '@/interfaces/ITenantRegistryData';
import { StripeConfig } from '@/interfaces/IStripeConfig';
import { SeoConfig } from '@/interfaces/ISeoConfig';

export interface CreateTenantRegistryData {
  tenantId: string;
  domain?: string | null;
  companyName?: string | null;
  logoUrl?: string | null;
  resendApiKey?: string | null;
  resendFromEmail?: string | null;
  theme?: Record<string, string> | null;
  stripeConfig?: StripeConfig | null;
  seoConfig?: SeoConfig | null;
}

export interface ITenantRegistryRepository {
  getByHostname(hostname: string): Promise<TenantRegistryData | null>;
  getByTenantId(tenantId: string): Promise<TenantRegistryData | null>;
  updateByHostname(hostname: string, data: Partial<CreateTenantRegistryData>): Promise<TenantRegistryData>;
  create(hostname: string, data: CreateTenantRegistryData): Promise<TenantRegistryData>;
  /** Persists a raw Stripe event under tenant_registry/{hostname}/stripe_events/{eventId} */
  saveStripeEvent(hostname: string, eventId: string, data: Record<string, unknown>): Promise<void>;
}
