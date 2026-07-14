import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const TENANT_ID = 'tenant-abc';
const USER_ID = 'user-123';

const mockVerifyIdToken = vi.fn();
const mockGet = vi.fn();

vi.mock('@/lib/firebase/admin', () => ({
	adminAuth: {
		verifyIdToken: (...args: unknown[]) => mockVerifyIdToken(...args)
	},
	adminDb: {
		collection: () => ({
			doc: () => ({
				get: () => mockGet()
			})
		})
	}
}));

vi.mock('@/lib/auth/resolveTenantId', () => ({
	resolveEffectiveHostname: (host: string) => host.split(':')[0]
}));

import { checkAuth } from './checkAuth';

function makeRequest(token: string, host = 'test.example.com'): NextRequest {
	return new NextRequest('http://test.example.com/api/profile', {
		headers: {
			authorization: `Bearer ${token}`,
			host
		}
	});
}

function makeDecodedToken(overrides: Record<string, unknown> = {}) {
	return {
		uid: USER_ID,
		email: 'test@example.com',
		email_verified: false,
		firebase: { tenant: TENANT_ID },
		...overrides
	};
}

function makeRegistryDoc(tenantId: string = TENANT_ID) {
	return {
		exists: true,
		data: () => ({
			tenantId,
			theme: null,
			domain: null,
			companyName: 'TestCo',
			logoUrl: null,
			resendApiKey: 'key',
			resendFromEmail: 'noreply@test.com'
		})
	};
}

describe('checkAuth', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGet.mockResolvedValue(makeRegistryDoc());
	});

	it('returns emailVerified: true when token has email_verified: true', async () => {
		mockVerifyIdToken.mockResolvedValue(
			makeDecodedToken({ email_verified: true })
		);

		const result = await checkAuth(makeRequest('valid-token'));

		expect(result.emailVerified).toBe(true);
		expect(result.userId).toBe(USER_ID);
		expect(result.tenantId).toBe(TENANT_ID);
	});

	it('returns emailVerified: false when token has email_verified: false', async () => {
		mockVerifyIdToken.mockResolvedValue(
			makeDecodedToken({ email_verified: false })
		);

		const result = await checkAuth(makeRequest('valid-token'));

		expect(result.emailVerified).toBe(false);
	});

	it('defaults emailVerified to false when email_verified is missing from token', async () => {
		const tokenWithout = makeDecodedToken() as Record<string, unknown>;
		delete tokenWithout.email_verified;
		mockVerifyIdToken.mockResolvedValue(tokenWithout);

		const result = await checkAuth(makeRequest('valid-token'));

		expect(result.emailVerified).toBe(false);
	});

	it('throws when no authorization header', async () => {
		const req = new NextRequest('http://test.example.com/api/profile');

		await expect(checkAuth(req)).rejects.toThrow('Authentication required');
	});

	it('throws on tenant ID mismatch', async () => {
		mockVerifyIdToken.mockResolvedValue(
			makeDecodedToken({ firebase: { tenant: 'wrong-tenant' } })
		);

		await expect(checkAuth(makeRequest('valid-token'))).rejects.toThrow(
			'Tenant ID mismatch'
		);
	});
});
