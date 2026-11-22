import { TenantRegistryData } from '@/interfaces/ITenantRegistryData';

/**
 * Pure helpers that derive the installable-app (PWA) identity of a tenant
 * from its `tenant_registry` document. Nothing here touches the network,
 * so everything is unit-testable.
 */

/** Page the installed app opens. The admin dashboard redirects to login when there is no session. */
export const PWA_START_URL = '/u/admin/dashboard';

export const PWA_DEFAULT_NAME = 'LinkHub';
export const PWA_DEFAULT_THEME_COLOR = '#18181b';
export const PWA_DEFAULT_BACKGROUND_COLOR = '#ffffff';

/** Home-screen labels are cut off by the OS beyond roughly 12 characters. */
const SHORT_NAME_MAX_LENGTH = 12;

/** Icon sizes served by `/pwa-icon/[size]`. 180 is the iOS apple-touch-icon size. */
export const PWA_ICON_SIZES = [180, 192, 512] as const;
export type PwaIconSize = (typeof PWA_ICON_SIZES)[number];

export function isPwaIconSize(value: number): value is PwaIconSize {
	return (PWA_ICON_SIZES as readonly number[]).includes(value);
}

export interface TenantPwaIdentity {
	name: string;
	shortName: string;
	description?: string;
	themeColor: string;
	backgroundColor: string;
}

export interface WebManifest {
	id: string;
	name: string;
	short_name: string;
	description?: string;
	lang: string;
	start_url: string;
	scope: string;
	display: 'standalone';
	theme_color: string;
	background_color: string;
	icons: Array<{
		src: string;
		sizes: string;
		type: string;
		purpose: 'any' | 'maskable';
	}>;
}

function clean(value: string | null | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

export function truncateShortName(name: string): string {
	if (name.length <= SHORT_NAME_MAX_LENGTH) return name;
	return name.slice(0, SHORT_NAME_MAX_LENGTH).trimEnd();
}

/**
 * name       <- seoConfig.siteName, then companyName
 * short_name <- companyName (truncated), then name
 * colors     <- tenant theme (primary / background) with neutral fallbacks
 */
export function resolveTenantPwaIdentity(
	tenant: Pick<
		TenantRegistryData,
		'companyName' | 'seoConfig' | 'theme'
	>
): TenantPwaIdentity {
	const companyName = clean(tenant.companyName);
	const name =
		clean(tenant.seoConfig?.siteName) ?? companyName ?? PWA_DEFAULT_NAME;
	const shortName = truncateShortName(companyName ?? name);

	return {
		name,
		shortName,
		description: clean(tenant.seoConfig?.description),
		themeColor: clean(tenant.theme?.primary) ?? PWA_DEFAULT_THEME_COLOR,
		backgroundColor:
			clean(tenant.theme?.background) ?? PWA_DEFAULT_BACKGROUND_COLOR
	};
}

export function buildTenantManifest(
	tenant: Pick<TenantRegistryData, 'companyName' | 'seoConfig' | 'theme'>
): WebManifest {
	const identity = resolveTenantPwaIdentity(tenant);

	return {
		id: '/',
		name: identity.name,
		short_name: identity.shortName,
		...(identity.description ? { description: identity.description } : {}),
		lang: 'es',
		start_url: PWA_START_URL,
		scope: '/',
		display: 'standalone',
		theme_color: identity.themeColor,
		background_color: identity.backgroundColor,
		icons: [
			{
				src: '/pwa-icon/192',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'any'
			},
			{
				src: '/pwa-icon/512',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any'
			},
			{
				src: '/pwa-icon/512?maskable=1',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable'
			}
		]
	};
}
