import { TenantTheme } from './ITenantTheme';
import { StripeConfig } from './IStripeConfig';
import { SeoConfig } from './ISeoConfig';

export interface TenantRegistryData {
	tenantId: string;
	theme: TenantTheme | null;
	companyName?: string | null;
	logoUrl?: string | null;
	domain: string | null;
	resendApiKey?: string | null;
	resendFromEmail?: string | null;
	stripeConfig?: StripeConfig | null;
	seoConfig?: SeoConfig | null;
}
