import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// vi.hoisted — mock fns must be defined before vi.mock factories are hoisted
// ---------------------------------------------------------------------------
const { mockCheckAuth, mockCreateWithId, mockGetProfile } = vi.hoisted(() => ({
	mockCheckAuth: vi.fn(),
	mockCreateWithId: vi.fn(),
	mockGetProfile: vi.fn()
}));

vi.mock('@/lib/auth/checkAuth', () => ({
	checkAuth: mockCheckAuth
}));

vi.mock('@/infrastructure/container', () => ({
	container: {
		getProfileUseCase: { execute: mockGetProfile }
	},
	userRepo: {
		createWithId: mockCreateWithId
	}
}));

import { POST } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TENANT_ID = 'tenant-abc';
const USER_ID = 'user-123';

const MOCK_USER = {
	id: USER_ID,
	name: 'Test User',
	email: 'test@example.com',
	plan: 'free',
	links: [],
	calendarSlots: [],
	calendarEnabled: false,
	contactFormEnabled: false
};

function makeRequest(body: Record<string, unknown>) {
	return new NextRequest('http://localhost/api/auth/signup', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/auth/signup', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCheckAuth.mockResolvedValue({ userId: USER_ID, tenantId: TENANT_ID });
		mockGetProfile.mockResolvedValue(MOCK_USER);
		mockCreateWithId.mockResolvedValue(MOCK_USER);
	});

	it('creates user without referredBy when not provided', async () => {
		const req = makeRequest({ name: 'Test User', email: 'test@example.com' });
		const res = await POST(req);

		expect(res.status).toBe(201);
		expect(mockCreateWithId).toHaveBeenCalledWith(
			TENANT_ID,
			USER_ID,
			expect.not.objectContaining({ referredBy: expect.anything() })
		);
	});

	it('stores referredBy in user document when provided', async () => {
		const req = makeRequest({
			name: 'Test User',
			email: 'test@example.com',
			referredBy: 'REF42'
		});
		const res = await POST(req);

		expect(res.status).toBe(201);
		expect(mockCreateWithId).toHaveBeenCalledWith(
			TENANT_ID,
			USER_ID,
			expect.objectContaining({ referredBy: 'REF42' })
		);
	});

	it('returns 201 with user profile on success', async () => {
		const req = makeRequest({ name: 'Test User', email: 'test@example.com' });
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(201);
		expect(body).toEqual(MOCK_USER);
	});

	it('returns 400 when checkAuth throws', async () => {
		mockCheckAuth.mockRejectedValue(new Error('Unauthorized'));
		const req = makeRequest({ name: 'Test User', email: 'test@example.com' });
		const res = await POST(req);

		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe('Unauthorized');
	});
});
