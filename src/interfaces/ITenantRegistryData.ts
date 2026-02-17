import { TenantTheme } from './ITenantTheme';

export interface TenantRegistryData {
	tenantId: string;
	theme: TenantTheme | null;
	companyName?: string | null;
	logoUrl?: string | null;
	domain: string | null;
	resendApiKey?: string | null;
	resendFromEmail?: string | null;
}
