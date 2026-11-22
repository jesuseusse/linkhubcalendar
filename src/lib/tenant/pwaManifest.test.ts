import { describe, it, expect } from 'vitest';
import {
	buildTenantManifest,
	isPwaIconSize,
	resolveTenantPwaIdentity,
	truncateShortName,
	PWA_DEFAULT_BACKGROUND_COLOR,
	PWA_DEFAULT_NAME,
	PWA_DEFAULT_THEME_COLOR,
	PWA_START_URL
} from './pwaManifest';
import { config as proxyConfig } from '@/proxy';

const seo = (overrides: Record<string, unknown> = {}) => ({
	siteName: 'Una Mujer Bonita – Citas',
	title: 'Una Mujer Bonita',
	description: 'Agenda tu cita',
	keywords: [],
	ogImage: null,
	favicon: null,
	canonicalUrl: null,
	locale: 'es_ES',
	twitterHandle: null,
	organizationType: 'Organization',
	...overrides
});

describe('resolveTenantPwaIdentity', () => {
	it('uses siteName for name and companyName for short_name', () => {
		const identity = resolveTenantPwaIdentity({
			companyName: 'Una Mujer Bonita',
			seoConfig: seo(),
			theme: { primary: '#d946ef', background: '#fff0f6' }
		});
		expect(identity.name).toBe('Una Mujer Bonita – Citas');
		expect(identity.shortName).toBe('Una Mujer Bo');
		expect(identity.themeColor).toBe('#d946ef');
		expect(identity.backgroundColor).toBe('#fff0f6');
		expect(identity.description).toBe('Agenda tu cita');
	});

	it('falls back to companyName when there is no seoConfig', () => {
		const identity = resolveTenantPwaIdentity({
			companyName: 'Una Barbería',
			seoConfig: null,
			theme: null
		});
		expect(identity.name).toBe('Una Barbería');
		expect(identity.shortName).toBe('Una Barbería');
		expect(identity.description).toBeUndefined();
	});

	it('falls back to neutral defaults for a tenant with no branding', () => {
		const identity = resolveTenantPwaIdentity({
			companyName: null,
			seoConfig: null,
			theme: null
		});
		expect(identity.name).toBe(PWA_DEFAULT_NAME);
		expect(identity.themeColor).toBe(PWA_DEFAULT_THEME_COLOR);
		expect(identity.backgroundColor).toBe(PWA_DEFAULT_BACKGROUND_COLOR);
	});

	it('ignores blank strings', () => {
		const identity = resolveTenantPwaIdentity({
			companyName: '   ',
			seoConfig: seo({ siteName: '' }),
			theme: { primary: '  ' }
		});
		expect(identity.name).toBe(PWA_DEFAULT_NAME);
		expect(identity.themeColor).toBe(PWA_DEFAULT_THEME_COLOR);
	});
});

describe('truncateShortName', () => {
	it('keeps short names untouched', () => {
		expect(truncateShortName('Una Barbería')).toBe('Una Barbería');
	});

	it('cuts long names to 12 characters without trailing spaces', () => {
		expect(truncateShortName('Una Mujer Bonita')).toBe('Una Mujer Bo');
		expect(truncateShortName('Salon de Belleza Eusse')).toBe('Salon de Bel');
		expect(truncateShortName('Hola mundo grande')).toBe('Hola mundo g');
		expect(truncateShortName('Hola mundo  grande')).toBe('Hola mundo');
	});
});

describe('buildTenantManifest', () => {
	const manifest = buildTenantManifest({
		companyName: 'Una Barbería',
		seoConfig: null,
		theme: { primary: '#111111' }
	});

	it('opens the admin dashboard as a standalone app scoped to the whole host', () => {
		expect(manifest.start_url).toBe(PWA_START_URL);
		expect(manifest.start_url).toBe('/u/admin/dashboard');
		expect(manifest.scope).toBe('/');
		expect(manifest.display).toBe('standalone');
	});

	it('declares 192, 512 and maskable 512 PNG icons served by the tenant icon route', () => {
		expect(manifest.icons.map(i => [i.sizes, i.purpose, i.src])).toEqual([
			['192x192', 'any', '/pwa-icon/192'],
			['512x512', 'any', '/pwa-icon/512'],
			['512x512', 'maskable', '/pwa-icon/512?maskable=1']
		]);
		expect(manifest.icons.every(i => i.type === 'image/png')).toBe(true);
	});

	it('omits description when the tenant has none', () => {
		expect('description' in manifest).toBe(false);
	});
});

describe('isPwaIconSize', () => {
	it('only accepts the sizes the icon route serves', () => {
		expect([180, 192, 512].every(isPwaIconSize)).toBe(true);
		expect(isPwaIconSize(100)).toBe(false);
		expect(isPwaIconSize(Number('abc'))).toBe(false);
	});
});

describe('proxy matcher', () => {
	const pattern = new RegExp(`^${proxyConfig.matcher[0]}$`);

	it('lets the manifest and icon routes reach the tenant rewrite', () => {
		expect(pattern.test('/manifest')).toBe(true);
		expect(pattern.test('/pwa-icon/192')).toBe(true);
	});

	it('serves the service worker and offline page as plain static files', () => {
		expect(pattern.test('/sw.js')).toBe(false);
		expect(pattern.test('/offline.html')).toBe(false);
	});
});
