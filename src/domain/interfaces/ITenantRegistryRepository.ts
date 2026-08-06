import { TenantRegistryData } from '@/interfaces/ITenantRegistryData';
import { StripeConfig } from '@/interfaces/IStripeConfig';
import { SeoConfig } from '@/interfaces/ISeoConfig';
import { SesConfig } from '@/interfaces/ISesConfig';

export interface CreateTenantRegistryData {
  tenantId: string;
  domain?: string | null;
  companyName?: string | null;
  logoUrl?: string | null;
  resendApiKey?: string | null;
  resendFromEmail?: string | null;
  sesConfig?: SesConfig | null;
  theme?: Record<string, string> | null;
  stripeConfig?: StripeConfig | null;
  seoConfig?: SeoConfig | null;
}

export type StripeEventOutcome =
  | { status: 'processed' }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; reason: string; retryable: boolean; message: string };

export interface ITenantRegistryRepository {
  getByHostname(hostname: string): Promise<TenantRegistryData | null>;
  getByTenantId(tenantId: string): Promise<TenantRegistryData | null>;
  updateByHostname(hostname: string, data: Partial<CreateTenantRegistryData>): Promise<TenantRegistryData>;
  create(hostname: string, data: CreateTenantRegistryData): Promise<TenantRegistryData>;
  /** Persists a raw Stripe event under tenant_registry/{hostname}/stripe_events/{eventId} */
  saveStripeEvent(hostname: string, eventId: string, data: Record<string, unknown>): Promise<void>;
  /**
   * Merges the processing outcome onto the same stripe_events doc — makes it possible
   * to tell "delivered" apart from "actually processed" without grepping server logs.
   */
  recordStripeEventOutcome(hostname: string, eventId: string, outcome: StripeEventOutcome): Promise<void>;
}
