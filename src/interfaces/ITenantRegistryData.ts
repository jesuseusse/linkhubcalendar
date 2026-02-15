import { TenantTheme } from './ITenantTheme';

export interface TenantRegistryData {
	tenantId: string;
	theme: TenantTheme | null;
	companyName?: string | null; // Optional company name for display purposes
	logoUrl?: string | null; // Optional URL to the tenant's logo for branding
	domain: string | null; // The domain associated with this tenant
}
