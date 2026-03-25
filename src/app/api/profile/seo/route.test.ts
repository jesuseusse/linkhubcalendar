import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TENANT_DOMAIN = 'misitio.com.dev';
const DOMAIN = 'misitio.com';
const LOGO_URL = 'https://storage.example.com/logo.png';

// ---------------------------------------------------------------------------
// Hoisted mock fns
// ---------------------------------------------------------------------------
const {
	mockCheckAuth,
	mockResolveHostname,
	mockGetByHostname,
	mockUpdateByHostname
} = vi.hoisted(() => ({
	mockCheckAuth: vi.fn(),
	mockResolveHostname: vi.fn(),
	mockGetByHostname: vi.fn(),
	mockUpdateByHostname: vi.fn()
}));

vi.mock('@/lib/auth/checkAuth', () => ({ checkAuth: mockCheckAuth }));
vi.mock('@/lib/auth/resolveTenantId', () => ({
	resolveEffectiveHostname: mockResolveHostname
}));
vi.mock('@/infrastructure/container', () => ({
	container: {
		tenantRegistryRepo: {
			getByHostname: mockGetByHostname,
			updateByHostname: mockUpdateByHostname
		}
	}
}));

import { GET, PUT } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeGetRequest(): NextRequest {
	return new NextRequest('http://localhost/api/profile/seo', {
		headers: { Authorization: 'Bearer token', host: TENANT_DOMAIN }
	});
}

function makePutRequest(body: object): NextRequest {
	return new NextRequest('http://localhost/api/profile/seo', {
		method: 'PUT',
		headers: {
			Authorization: 'Bearer token',
			host: TENANT_DOMAIN,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
}

function makeRegistry(overrides: Record<string, unknown> = {}) {
	return {
		tenantId: 'tenant-abc123',
		domain: DOMAIN,
		logoUrl: LOGO_URL,
		theme: null,
		companyName: 'Mi Empresa',
		resendApiKey: null,
		resendFromEmail: null,
		sesConfig: null,
		stripeConfig: null,
		seoConfig: null,
		...overrides
	};
}

const CLIENT_PAYLOAD = {
	siteName: 'Mi Empresa',
	title: 'Mi Empresa — Inicio',
	description: 'Descripción del sitio',
	keywords: ['diseño', 'web'],
	twitterHandle: '@miempresa',
	// These must be overridden server-side regardless of client values:
	ogImage: null,
	favicon: null,
	canonicalUrl: null,
	locale: 'en_US',
	organizationType: 'Person'
};

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
describe('GET /api/profile/seo', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCheckAuth.mockResolvedValue({ userId: 'user-1', tenantId: 'tenant-abc' });
		mockResolveHostname.mockReturnValue(TENANT_DOMAIN);
	});

	it('returns stored seoConfig from the tenant registry', async () => {
		const seoConfig = {
			siteName: 'Mi Empresa',
			title: 'Mi Empresa — Inicio',
			description: 'Descripción del sitio',
			keywords: ['diseño', 'web'],
			ogImage: LOGO_URL,
			favicon: LOGO_URL,
			canonicalUrl: DOMAIN,
			locale: 'es_ES',
			twitterHandle: '@miempresa',
			organizationType: 'Organization'
		};
		mockGetByHostname.mockResolvedValue(makeRegistry({ seoConfig }));

		const res = await GET(makeGetRequest());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.seoConfig).toEqual(seoConfig);
		expect(mockGetByHostname).toHaveBeenCalledWith(TENANT_DOMAIN);
	});

	it('returns null when the registry has no seoConfig set', async () => {
		mockGetByHostname.mockResolvedValue(makeRegistry({ seoConfig: null }));

		const res = await GET(makeGetRequest());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.seoConfig).toBeNull();
	});

	it('returns 400 when auth fails', async () => {
		mockCheckAuth.mockRejectedValue(new Error('Authentication required'));

		const res = await GET(makeGetRequest());
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toBe('Authentication required');
		expect(mockGetByHostname).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// PUT
// ---------------------------------------------------------------------------
describe('PUT /api/profile/seo', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCheckAuth.mockResolvedValue({ userId: 'user-1', tenantId: 'tenant-abc' });
		mockResolveHostname.mockReturnValue(TENANT_DOMAIN);
		mockGetByHostname.mockResolvedValue(makeRegistry());
		mockUpdateByHostname.mockResolvedValue(makeRegistry());
	});

	it('injects canonicalUrl from registry domain', async () => {
		await PUT(makePutRequest(CLIENT_PAYLOAD));

		expect(mockUpdateByHostname).toHaveBeenCalledWith(
			TENANT_DOMAIN,
			expect.objectContaining({
				seoConfig: expect.objectContaining({ canonicalUrl: DOMAIN })
			})
		);
	});

	it('injects favicon and ogImage from registry logoUrl', async () => {
		await PUT(makePutRequest(CLIENT_PAYLOAD));

		expect(mockUpdateByHostname).toHaveBeenCalledWith(
			TENANT_DOMAIN,
			expect.objectContaining({
				seoConfig: expect.objectContaining({
					favicon: LOGO_URL,
					ogImage: LOGO_URL
				})
			})
		);
	});

	it('always sets locale to es_ES, ignoring client value', async () => {
		await PUT(makePutRequest({ ...CLIENT_PAYLOAD, locale: 'en_US' }));

		expect(mockUpdateByHostname).toHaveBeenCalledWith(
			TENANT_DOMAIN,
			expect.objectContaining({
				seoConfig: expect.objectContaining({ locale: 'es_ES' })
			})
		);
	});

	it('always sets organizationType to Organization, ignoring client value', async () => {
		await PUT(makePutRequest({ ...CLIENT_PAYLOAD, organizationType: 'Person' }));

		expect(mockUpdateByHostname).toHaveBeenCalledWith(
			TENANT_DOMAIN,
			expect.objectContaining({
				seoConfig: expect.objectContaining({ organizationType: 'Organization' })
			})
		);
	});

	it('passes through client-provided content fields unchanged', async () => {
		await PUT(makePutRequest(CLIENT_PAYLOAD));

		expect(mockUpdateByHostname).toHaveBeenCalledWith(
			TENANT_DOMAIN,
			expect.objectContaining({
				seoConfig: expect.objectContaining({
					siteName: CLIENT_PAYLOAD.siteName,
					title: CLIENT_PAYLOAD.title,
					description: CLIENT_PAYLOAD.description,
					keywords: CLIENT_PAYLOAD.keywords,
					twitterHandle: CLIENT_PAYLOAD.twitterHandle
				})
			})
		);
	});

	it('returns the updated seoConfig from the registry', async () => {
		const savedSeoConfig = {
			...CLIENT_PAYLOAD,
			canonicalUrl: DOMAIN,
			favicon: LOGO_URL,
			ogImage: LOGO_URL,
			locale: 'es_ES',
			organizationType: 'Organization'
		};
		mockUpdateByHostname.mockResolvedValue(makeRegistry({ seoConfig: savedSeoConfig }));

		const res = await PUT(makePutRequest(CLIENT_PAYLOAD));
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.seoConfig).toEqual(savedSeoConfig);
	});

	it('uses null for canonicalUrl when registry has no domain', async () => {
		mockGetByHostname.mockResolvedValue(makeRegistry({ domain: null }));

		await PUT(makePutRequest(CLIENT_PAYLOAD));

		expect(mockUpdateByHostname).toHaveBeenCalledWith(
			TENANT_DOMAIN,
			expect.objectContaining({
				seoConfig: expect.objectContaining({ canonicalUrl: null })
			})
		);
	});

	it('uses null for favicon and ogImage when registry has no logoUrl', async () => {
		mockGetByHostname.mockResolvedValue(makeRegistry({ logoUrl: null }));

		await PUT(makePutRequest(CLIENT_PAYLOAD));

		expect(mockUpdateByHostname).toHaveBeenCalledWith(
			TENANT_DOMAIN,
			expect.objectContaining({
				seoConfig: expect.objectContaining({ favicon: null, ogImage: null })
			})
		);
	});

	it('returns 400 when auth fails', async () => {
		mockCheckAuth.mockRejectedValue(new Error('Authentication required'));

		const res = await PUT(makePutRequest(CLIENT_PAYLOAD));
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toBe('Authentication required');
		expect(mockUpdateByHostname).not.toHaveBeenCalled();
	});
});
