import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Constants from the real event provided for testing
// ---------------------------------------------------------------------------
const TENANT_DOMAIN = 'linkhubcalendar.com.dev';
const TENANT_ID = 'linkhubcalendar-8pe2p';
const USER_EMAIL = 'jesuseusse@outlook.com';
const USER_ID = 'user-abc123';
const SUBSCRIPTION_ID = 'sub_1T2is88gTI2M8y3RxsJrOjdW';
const EVENT_ID = 'evt_test_checkout_completed';
const PRO_PRICE_ID = 'price_pro_monthly_test';
const CURRENT_PERIOD_END = 1774144254; // Unix seconds → planExpiredAt = × 1000

// ---------------------------------------------------------------------------
// vi.hoisted — mock fns must be defined before vi.mock factories are hoisted
// ---------------------------------------------------------------------------
const {
	mockGetByHostname,
	mockSaveStripeEvent,
	mockFindByEmail,
	mockUpdatePlan,
	mockConstructEvent,
	mockSubscriptionsRetrieve,
	mockSubscriptionsUpdate
} = vi.hoisted(() => ({
	mockGetByHostname: vi.fn(),
	mockSaveStripeEvent: vi.fn(),
	mockFindByEmail: vi.fn(),
	mockUpdatePlan: vi.fn(),
	mockConstructEvent: vi.fn(),
	mockSubscriptionsRetrieve: vi.fn(),
	mockSubscriptionsUpdate: vi.fn()
}));

// ---------------------------------------------------------------------------
// Container mock — replaces all Firestore/Firebase interactions
// ---------------------------------------------------------------------------
vi.mock('@/infrastructure/container', () => ({
	container: {
		tenantRegistryRepo: {
			getByHostname: mockGetByHostname,
			saveStripeEvent: mockSaveStripeEvent
		},
		userRepo: {
			findByEmail: mockFindByEmail,
			updatePlan: mockUpdatePlan
		}
	}
}));

// ---------------------------------------------------------------------------
// Stripe mock — use regular function (not arrow) so it works as a constructor
// ---------------------------------------------------------------------------
vi.mock('stripe', () => ({
	default: vi.fn(function () {
		return {
			webhooks: { constructEvent: mockConstructEvent },
			subscriptions: {
				retrieve: mockSubscriptionsRetrieve,
				update: mockSubscriptionsUpdate
			}
		};
	})
}));

// Import AFTER mocks are registered
import { POST } from './route';

// ---------------------------------------------------------------------------
// Fixtures — built from the real checkout.session.completed event
// ---------------------------------------------------------------------------
const SESSION_OBJECT = {
	id: 'cs_test_a1n0WR0G6hmlPp3JJRqV3J0qLq0flbQ7EPq765hNNxqfJfGwmnadXkWpod',
	object: 'checkout.session',
	subscription: SUBSCRIPTION_ID,
	mode: 'subscription',
	status: 'complete',
	payment_status: 'paid',
	customer: 'cus_U0kMppwVLTzzFE',
	customer_email: USER_EMAIL,
	customer_details: { email: USER_EMAIL, name: 'Jesus' },
	metadata: {
		domain: TENANT_DOMAIN,
		email: USER_EMAIL,
		tenantId: TENANT_ID
	},
	cancel_url: `https://${TENANT_DOMAIN}/admin/dashboard?successStripe=false`,
	success_url: `https://${TENANT_DOMAIN}/admin/dashboard?successStripe=true`,
	amount_subtotal: 20000,
	amount_total: 20000,
	currency: 'mxn',
	livemode: false,
	created: 1771552254,
	invoice: 'in_1T2is68gTI2M8y3RPEQSwesT'
};

const STRIPE_EVENT = {
	id: EVENT_ID,
	object: 'event',
	type: 'checkout.session.completed',
	created: 1771552254,
	livemode: false,
	data: { object: SESSION_OBJECT, previous_attributes: null }
};

function makeRequest(overrides: { domain?: string; body?: string } = {}) {
	const domain = overrides.domain ?? TENANT_DOMAIN;
	const body = overrides.body ?? JSON.stringify(STRIPE_EVENT);
	return new NextRequest(
		`http://localhost/api/stripe/webhook?domain=${domain}`,
		{
			method: 'POST',
			headers: {
				'stripe-signature': 'whsec_test_sig_abc123',
				'content-type': 'application/json'
			},
			body
		}
	);
}

function makeTenantRegistry(proPriceId = PRO_PRICE_ID) {
	return {
		tenantId: TENANT_ID,
		domain: TENANT_DOMAIN,
		theme: null,
		stripeConfig: {
			secretKey: 'sk_test_xxx',
			publishableKey: 'pk_test_xxx',
			webhookSecret: 'whsec_xxx',
			proPriceId
		}
	};
}

// In Stripe v20, current_period_end is on SubscriptionItem, not Subscription
function makeSubscription(priceId = PRO_PRICE_ID) {
	return {
		id: SUBSCRIPTION_ID,
		metadata: {},
		items: {
			data: [{ price: { id: priceId }, current_period_end: CURRENT_PERIOD_END }]
		}
	};
}

function makeUser() {
	return { id: USER_ID, email: USER_EMAIL };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/stripe/webhook — checkout.session.completed', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetByHostname.mockResolvedValue(makeTenantRegistry());
		mockSaveStripeEvent.mockResolvedValue(undefined);
		mockConstructEvent.mockReturnValue(STRIPE_EVENT);
		mockSubscriptionsRetrieve.mockResolvedValue(makeSubscription());
		mockSubscriptionsUpdate.mockResolvedValue({});
		mockFindByEmail.mockResolvedValue(makeUser());
		mockUpdatePlan.mockResolvedValue(undefined);
	});

	it('returns 400 when domain query param is missing', async () => {
		const req = new NextRequest('http://localhost/api/stripe/webhook', {
			method: 'POST',
			body: 'body'
		});
		const res = await POST(req);
		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json.error).toMatch(/domain/i);
	});

	it('returns 404 when tenant registry document does not exist', async () => {
		mockGetByHostname.mockResolvedValue(null);
		const res = await POST(makeRequest());
		expect(res.status).toBe(404);
		const json = await res.json();
		expect(json.error).toMatch(/tenant not found/i);
	});

	it('returns 400 when Stripe is not configured for the tenant', async () => {
		mockGetByHostname.mockResolvedValue({
			tenantId: TENANT_ID,
			domain: TENANT_DOMAIN,
			theme: null,
			stripeConfig: null
		});
		const res = await POST(makeRequest());
		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json.error).toMatch(/stripe not configured/i);
	});

	it('returns 400 when Stripe signature verification fails', async () => {
		mockConstructEvent.mockImplementation(() => {
			throw new Error('No signatures found matching the expected signature');
		});
		const res = await POST(makeRequest());
		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json.error).toMatch(/signature/i);
	});

	it('saves the full Stripe event via tenantRegistryRepo.saveStripeEvent', async () => {
		await POST(makeRequest());
		expect(mockSaveStripeEvent).toHaveBeenCalledWith(
			TENANT_DOMAIN,
			EVENT_ID,
			expect.objectContaining({
				id: EVENT_ID,
				type: 'checkout.session.completed',
				receivedAt: expect.any(Number)
			})
		);
	});

	it('retrieves the subscription using the ID from the session', async () => {
		await POST(makeRequest());
		expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith(SUBSCRIPTION_ID);
	});

	it('propagates metadata to the Stripe subscription for future renewal events', async () => {
		await POST(makeRequest());
		expect(mockSubscriptionsUpdate).toHaveBeenCalledWith(
			SUBSCRIPTION_ID,
			expect.objectContaining({
				metadata: expect.objectContaining({
					tenantId: TENANT_ID,
					email: USER_EMAIL
				})
			})
		);
	});

	it('finds the user via userRepo.findByEmail', async () => {
		await POST(makeRequest());
		expect(mockFindByEmail).toHaveBeenCalledWith(TENANT_ID, USER_EMAIL);
	});

	it('upgrades user to pro with correct planExpiredAt when priceId matches proPriceId', async () => {
		await POST(makeRequest());
		expect(mockUpdatePlan).toHaveBeenCalledWith(
			TENANT_ID,
			USER_ID,
			'pro',
			CURRENT_PERIOD_END * 1000 // Stripe seconds → JS milliseconds
		);
	});

	it('does NOT upgrade user when priceId does not match proPriceId', async () => {
		mockSubscriptionsRetrieve.mockResolvedValue(makeSubscription('price_other_plan'));
		await POST(makeRequest());
		expect(mockUpdatePlan).not.toHaveBeenCalled();
	});

	it('returns { received: true } with status 200 on success', async () => {
		const res = await POST(makeRequest());
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({ received: true });
	});

	it('returns 200 even when user is not found in the repo (safe degradation)', async () => {
		mockFindByEmail.mockResolvedValue(null);
		const res = await POST(makeRequest());
		expect(res.status).toBe(200);
		expect(mockUpdatePlan).not.toHaveBeenCalled();
	});

	it('returns 200 even when Stripe subscription retrieval throws (safe degradation)', async () => {
		mockSubscriptionsRetrieve.mockRejectedValue(new Error('Stripe API error'));
		const res = await POST(makeRequest());
		expect(res.status).toBe(200);
		expect(mockUpdatePlan).not.toHaveBeenCalled();
	});
});
