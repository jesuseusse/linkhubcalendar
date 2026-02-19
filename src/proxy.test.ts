import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/server
const mockRewrite = vi.fn((url: URL) => ({
	headers: new Headers(),
	type: 'rewrite' as const,
	url: url.toString()
}));

const mockNext = vi.fn(() => ({
	headers: new Headers(),
	type: 'next' as const
}));

vi.mock('next/server', () => ({
	NextResponse: {
		rewrite: (url: URL) => mockRewrite(url),
		next: () => mockNext()
	}
}));

import { proxy } from './proxy';

function createMockRequest(host: string, pathname: string = '/') {
	const url = new URL(`https://${host}${pathname}`);
	return {
		headers: {
			get: (name: string) => (name === 'host' ? host : null)
		},
		nextUrl: Object.assign(url, {
			clone: () => new URL(url.toString())
		})
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

describe('proxy', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.NEXT_PUBLIC_DOMAIN = 'linkhub.dev';
		delete process.env.NEXT_PUBLIC_DEFAULT_TENANT_HOSTNAME;
	});

	it('skips rewrite for main domain', async () => {
		const req = createMockRequest('linkhub.dev', '/some-path');
		await proxy(req);

		expect(mockNext).toHaveBeenCalled();
		expect(mockRewrite).not.toHaveBeenCalled();
	});

	it('rewrites tenant subdomain to /tenants/{tenantId}{pathname}', async () => {
		const req = createMockRequest('acme.linkhub.dev', '/');
		await proxy(req);

		expect(mockRewrite).toHaveBeenCalledTimes(1);
		const rewrittenUrl: URL = mockRewrite.mock.calls[0][0];
		expect(rewrittenUrl.pathname).toBe('/tenants/acme/');
	});

	it('rewrites tenant with nested path correctly', async () => {
		const req = createMockRequest('acme.linkhub.dev', '/about');
		await proxy(req);

		expect(mockRewrite).toHaveBeenCalledTimes(1);
		const rewrittenUrl: URL = mockRewrite.mock.calls[0][0];
		expect(rewrittenUrl.pathname).toBe('/tenants/acme/about');
	});

	it('rewrites custom domain to /tenants/{domain}{pathname}', async () => {
		const req = createMockRequest('mysite.com', '/contact');
		await proxy(req);

		expect(mockRewrite).toHaveBeenCalledTimes(1);
		const rewrittenUrl: URL = mockRewrite.mock.calls[0][0];
		expect(rewrittenUrl.pathname).toBe('/tenants/mysite/contact');
	});

	it('sets x-tenant-id header on rewrite response', async () => {
		const req = createMockRequest('acme.linkhub.dev', '/');
		const response = await proxy(req);

		expect(response.headers.get('x-tenant-id')).toBe('acme');
	});

	it('uses default tenant hostname for localhost', async () => {
		process.env.NEXT_PUBLIC_DEFAULT_TENANT_HOSTNAME = 'demo-tenant';
		const req = createMockRequest('localhost:3000', '/');
		await proxy(req);

		expect(mockRewrite).toHaveBeenCalledTimes(1);
		const rewrittenUrl: URL = mockRewrite.mock.calls[0][0];
		expect(rewrittenUrl.pathname).toBe('/tenants/demo-tenant/');
	});

	it('does NOT use default tenant for 127.0.0.1 (tenantId becomes "127" after split)', async () => {
		process.env.NEXT_PUBLIC_DEFAULT_TENANT_HOSTNAME = 'demo-tenant';
		const req = createMockRequest('127.0.0.1', '/dashboard');
		await proxy(req);

		// BUG: checks tenantId (split result "127") instead of original host
		expect(mockRewrite).toHaveBeenCalledTimes(1);
		const rewrittenUrl: URL = mockRewrite.mock.calls[0][0];
		expect(rewrittenUrl.pathname).toBe('/tenants/127/dashboard');
	});

	it('uses default tenant hostname for any amplifyapp.com host', async () => {
		process.env.NEXT_PUBLIC_DEFAULT_TENANT_HOSTNAME = 'demo-tenant';
		const req = createMockRequest('my-app.amplifyapp.com', '/');
		await proxy(req);

		expect(mockRewrite).toHaveBeenCalledTimes(1);
		const rewrittenUrl: URL = mockRewrite.mock.calls[0][0];
		expect(rewrittenUrl.pathname).toBe('/tenants/demo-tenant/');
	});

	it('uses default tenant hostname for Amplify preview URL (main.d3rdv7nxcenp6y.amplifyapp.com)', async () => {
		process.env.NEXT_PUBLIC_DEFAULT_TENANT_HOSTNAME = 'demo-tenant';
		const req = createMockRequest('main.d3rdv7nxcenp6y.amplifyapp.com', '/tenant');
		await proxy(req);

		expect(mockRewrite).toHaveBeenCalledTimes(1);
		const rewrittenUrl: URL = mockRewrite.mock.calls[0][0];
		expect(rewrittenUrl.pathname).toBe('/tenants/demo-tenant/tenant');
	});
});
