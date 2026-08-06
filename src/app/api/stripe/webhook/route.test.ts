import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import checkoutSessionData from './checkout.session.completed.mock.json';

// ---------------------------------------------------------------------------
// Constants derived from the real Stripe event fixture
// ---------------------------------------------------------------------------
const TENANT_DOMAIN = 'linkhubcalendar.com.dev';
const TENANT_ID = 'linkhubcalendar-8pe2p';
const USER_EMAIL = 'jesuseusse@outlook.com';
const USER_ID = 'user-abc123';
const SUBSCRIPTION_ID = 'sub_1T2is88gTI2M8y3RxsJrOjdW';
const EVENT_ID = 'evt_test_checkout_completed';
const PRO_PRICE_ID = 'price_pro_monthly_test';
const PRO_ANNUAL_PRICE_ID = 'price_pro_annual_test';
const CURRENT_PERIOD_END = 1774144254; // Unix seconds → planExpiredAt = × 1000

// ---------------------------------------------------------------------------
// vi.hoisted — mock fns must be defined before vi.mock factories are hoisted
// ---------------------------------------------------------------------------
const {
	mockGetByHostname,
	mockSaveStripeEvent,
	mockRecordStripeEventOutcome,
	mockFindByEmail,
	mockUpdatePlan,
	mockUpdateSubscriptionFlags,
	mockConstructEvent,
	mockSubscriptionsRetrieve,
	mockSubscriptionsUpdate,
	mockCreateEmailSenderService,
	mockSendStripeWebhookErrorNotification,
	mockSendUpcomingRenewalEmail,
	MockStripeInvalidRequestError
} = vi.hoisted(() => {
	// `errors.StripeInvalidRequestError` is real Stripe's shape for e.g. resource_missing —
	// webhookErrors.ts's callStripeApi() checks `instanceof` against it, so the Stripe mock
	// below must provide a compatible class rather than leaving `Stripe.errors` undefined.
	class MockStripeInvalidRequestError extends Error {
		type: string;
		code?: string;
		constructor(raw: { type: string; code?: string; message: string }) {
			super(raw.message);
			this.type = raw.type;
			this.code = raw.code;
		}
	}

	return {
		mockGetByHostname: vi.fn(),
		mockSaveStripeEvent: vi.fn(),
		mockRecordStripeEventOutcome: vi.fn(),
		mockFindByEmail: vi.fn(),
		mockUpdatePlan: vi.fn(),
		mockUpdateSubscriptionFlags: vi.fn(),
		mockConstructEvent: vi.fn(),
		mockSubscriptionsRetrieve: vi.fn(),
		mockSubscriptionsUpdate: vi.fn(),
		mockCreateEmailSenderService: vi.fn(),
		mockSendStripeWebhookErrorNotification: vi.fn(),
		mockSendUpcomingRenewalEmail: vi.fn(),
		MockStripeInvalidRequestError
	};
});

// ---------------------------------------------------------------------------
// Container mock — replaces all Firestore/Firebase interactions
// ---------------------------------------------------------------------------
vi.mock('@/infrastructure/container', () => ({
	container: {
		tenantRegistryRepo: {
			getByHostname: mockGetByHostname,
			saveStripeEvent: mockSaveStripeEvent,
			recordStripeEventOutcome: mockRecordStripeEventOutcome
		},
		userRepo: {
			findByEmail: mockFindByEmail,
			updatePlan: mockUpdatePlan,
			updateSubscriptionFlags: mockUpdateSubscriptionFlags
		}
	}
}));

// ---------------------------------------------------------------------------
// Email sender factory mock — used for alert emails and renewal reminders
// ---------------------------------------------------------------------------
vi.mock('@/infrastructure/services/emailSenderFactory', () => ({
	createEmailSenderService: mockCreateEmailSenderService
}));

// ---------------------------------------------------------------------------
// Stripe mock — use regular function (not arrow) so it works as a constructor.
// ---------------------------------------------------------------------------
vi.mock('stripe', () => {
	const StripeMock = vi.fn(function () {
		return {
			webhooks: { constructEvent: mockConstructEvent },
			subscriptions: {
				retrieve: mockSubscriptionsRetrieve,
				update: mockSubscriptionsUpdate
			}
		};
	});
	Object.assign(StripeMock, { errors: { StripeInvalidRequestError: MockStripeInvalidRequestError } });
	return { default: StripeMock };
});

// Import AFTER mocks are registered
import { POST } from './route';

// ---------------------------------------------------------------------------
// Fixtures — data field comes from the real checkout.session.completed payload
// ---------------------------------------------------------------------------
const STRIPE_EVENT = {
	id: EVENT_ID,
	object: 'event',
	type: 'checkout.session.completed',
	created: 1771552254,
	livemode: false,
	data: checkoutSessionData
};

function makeRequest(overrides: { body?: string; tenant?: string } = {}) {
	const body = overrides.body ?? JSON.stringify(STRIPE_EVENT);
	const url = overrides.tenant
		? `http://localhost/api/stripe/webhook?tenant=${overrides.tenant}`
		: 'http://localhost/api/stripe/webhook';
	return new NextRequest(url, {
		method: 'POST',
		headers: {
			'stripe-signature': 'whsec_test_sig_abc123',
			'content-type': 'application/json'
		},
		body
	});
}

function makeTenantRegistry(
	overrides: { proPriceId?: string; proAnnualPriceId?: string } = {}
) {
	return {
		tenantId: TENANT_ID,
		domain: TENANT_DOMAIN,
		theme: null,
		resendApiKey: 're_test_xxx',
		resendFromEmail: 'no-reply@linkhubcalendar.com.dev',
		stripeConfig: {
			secretKey: 'sk_test_xxx',
			publishableKey: 'pk_test_xxx',
			webhookSecret: 'whsec_xxx',
			proPriceId: overrides.proPriceId ?? PRO_PRICE_ID,
			proAnnualPriceId: overrides.proAnnualPriceId ?? PRO_ANNUAL_PRICE_ID
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
		delete process.env.NEXT_STRIPE_ALERT_EMAILS;
		mockRecordStripeEventOutcome.mockResolvedValue(undefined);
		mockSendStripeWebhookErrorNotification.mockResolvedValue(undefined);
		mockSendUpcomingRenewalEmail.mockResolvedValue(undefined);
		mockCreateEmailSenderService.mockReturnValue({
			sendStripeWebhookErrorNotification: mockSendStripeWebhookErrorNotification,
			sendUpcomingRenewalEmail: mockSendUpcomingRenewalEmail
		});
		mockGetByHostname.mockResolvedValue(makeTenantRegistry());
		mockSaveStripeEvent.mockResolvedValue(undefined);
		mockConstructEvent.mockReturnValue(STRIPE_EVENT);
		mockSubscriptionsRetrieve.mockResolvedValue(makeSubscription());
		mockSubscriptionsUpdate.mockResolvedValue({});
		mockFindByEmail.mockResolvedValue(makeUser());
		mockUpdatePlan.mockResolvedValue(undefined);
		mockUpdateSubscriptionFlags.mockResolvedValue(undefined);
	});

	it('returns 200 and skips gracefully when domain is missing from both URL and metadata', async () => {
		// No ?tenant= param, no metadata.domain → returns 200 to stop Stripe retries
		const body = JSON.stringify({ data: { object: { metadata: {} } } });
		const res = await POST(makeRequest({ body }));
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({ received: true });
	});

	it('resolves domain from ?tenant= URL query param when metadata is empty', async () => {
		// Event has no metadata.domain, but domain comes from the URL query param
		const bodyWithoutDomain = JSON.stringify({
			...STRIPE_EVENT,
			data: { object: { ...checkoutSessionData.object, metadata: { email: USER_EMAIL, tenantId: TENANT_ID } } }
		});
		mockConstructEvent.mockReturnValue({
			...STRIPE_EVENT,
			data: { object: { ...checkoutSessionData.object, metadata: { email: USER_EMAIL, tenantId: TENANT_ID } } }
		});
		const res = await POST(makeRequest({ body: bodyWithoutDomain, tenant: TENANT_DOMAIN }));
		expect(res.status).toBe(200);
		// Tenant should have been looked up using the URL param domain
		expect(mockGetByHostname).toHaveBeenCalledWith(TENANT_DOMAIN);
	});

	it('returns 404 when tenant registry document does not exist', async () => {
		mockGetByHostname.mockResolvedValue(null);
		const res = await POST(makeRequest());
		expect(res.status).toBe(404);
		const json = await res.json();
		expect(json.code).toBe('TENANT_NOT_FOUND');
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
		expect(json.code).toBe('STRIPE_NOT_CONFIGURED');
	});

	it('returns 400 when Stripe signature verification fails', async () => {
		mockConstructEvent.mockImplementation(() => {
			throw new Error('No signatures found matching the expected signature');
		});
		const res = await POST(makeRequest());
		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json.code).toBe('SIGNATURE_MISMATCH');
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
					domain: TENANT_DOMAIN,
					email: USER_EMAIL
				})
			})
		);
	});

	it('finds the user via userRepo.findByEmail', async () => {
		await POST(makeRequest());
		expect(mockFindByEmail).toHaveBeenCalledWith(TENANT_ID, USER_EMAIL);
	});

	it('upgrades user to pro with correct planExpiredAt and subscriptionId when priceId matches proPriceId', async () => {
		await POST(makeRequest());
		expect(mockUpdatePlan).toHaveBeenCalledWith(
			TENANT_ID,
			USER_ID,
			'pro',
			CURRENT_PERIOD_END * 1000, // Stripe seconds → JS milliseconds
			SUBSCRIPTION_ID,
			'month' // billingInterval defaults to 'month' when metadata.interval is absent
		);
	});

	it('upgrades user to pro with interval "year" when priceId matches proAnnualPriceId', async () => {
		mockSubscriptionsRetrieve.mockResolvedValue(makeSubscription(PRO_ANNUAL_PRICE_ID));
		await POST(makeRequest());
		expect(mockUpdatePlan).toHaveBeenCalledWith(
			TENANT_ID,
			USER_ID,
			'pro',
			CURRENT_PERIOD_END * 1000,
			SUBSCRIPTION_ID,
			'year'
		);
	});

	it('does NOT upgrade and does NOT retry (200) when priceId matches neither configured price — config drift', async () => {
		mockSubscriptionsRetrieve.mockResolvedValue(makeSubscription('price_other_plan'));
		const res = await POST(makeRequest());

		expect(res.status).toBe(200); // non-retryable — retrying the same event can't fix a bad price ID
		expect(mockUpdatePlan).not.toHaveBeenCalled();
		expect(mockRecordStripeEventOutcome).toHaveBeenCalledWith(
			TENANT_DOMAIN,
			EVENT_ID,
			expect.objectContaining({ status: 'failed', reason: 'PRICE_ID_MISMATCH', retryable: false })
		);
	});

	it('sends an alert email when NEXT_STRIPE_ALERT_EMAILS is configured and processing fails', async () => {
		process.env.NEXT_STRIPE_ALERT_EMAILS = 'ops@example.com, second@example.com';
		mockSubscriptionsRetrieve.mockResolvedValue(makeSubscription('price_other_plan'));
		await POST(makeRequest());

		expect(mockSendStripeWebhookErrorNotification).toHaveBeenCalledWith(
			expect.objectContaining({ tenantId: TENANT_ID }),
			['ops@example.com', 'second@example.com'],
			expect.objectContaining({
				eventId: EVENT_ID,
				eventType: 'checkout.session.completed',
				domain: TENANT_DOMAIN,
				reason: 'PRICE_ID_MISMATCH',
				retryable: false
			}),
			expect.anything()
		);
	});

	it('does NOT send an alert email when NEXT_STRIPE_ALERT_EMAILS is unset', async () => {
		mockSubscriptionsRetrieve.mockResolvedValue(makeSubscription('price_other_plan'));
		await POST(makeRequest());
		expect(mockSendStripeWebhookErrorNotification).not.toHaveBeenCalled();
	});

	it('returns { received: true } with status 200 on success', async () => {
		const res = await POST(makeRequest());
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({ received: true });
		expect(mockRecordStripeEventOutcome).toHaveBeenCalledWith(TENANT_DOMAIN, EVENT_ID, { status: 'processed' });
	});

	it('returns 200 (non-retryable) when user is not found in the repo, and alerts', async () => {
		process.env.NEXT_STRIPE_ALERT_EMAILS = 'ops@example.com';
		mockFindByEmail.mockResolvedValue(null);
		const res = await POST(makeRequest());
		expect(res.status).toBe(200);
		expect(mockUpdatePlan).not.toHaveBeenCalled();
		expect(mockSendStripeWebhookErrorNotification).toHaveBeenCalledWith(
			expect.anything(),
			['ops@example.com'],
			expect.objectContaining({ reason: 'USER_NOT_FOUND', retryable: false }),
			expect.anything()
		);
	});

	it('returns 500 (retryable) when the Stripe API call fails transiently — lets Stripe retry', async () => {
		mockSubscriptionsRetrieve.mockRejectedValue(new Error('Stripe API error'));
		const res = await POST(makeRequest());
		expect(res.status).toBe(500);
		expect(mockUpdatePlan).not.toHaveBeenCalled();
		expect(mockRecordStripeEventOutcome).toHaveBeenCalledWith(
			TENANT_DOMAIN,
			EVENT_ID,
			expect.objectContaining({ status: 'failed', reason: 'STRIPE_API_ERROR', retryable: true })
		);
	});

	it('returns 200 (non-retryable) when the subscription genuinely does not exist (resource_missing)', async () => {
		const notFoundErr = new MockStripeInvalidRequestError({
			type: 'invalid_request_error',
			code: 'resource_missing',
			message: 'No such subscription'
		});
		mockSubscriptionsRetrieve.mockRejectedValue(notFoundErr);
		const res = await POST(makeRequest());
		expect(res.status).toBe(200); // retrying a missing resource ID can never succeed
	});
});

// ---------------------------------------------------------------------------
// Helpers for subscription update / delete events
// ---------------------------------------------------------------------------
function makeSubscriptionObject(overrides: Record<string, unknown> = {}) {
	return {
		id: SUBSCRIPTION_ID,
		status: 'active',
		cancel_at_period_end: false,
		metadata: { tenantId: TENANT_ID, email: USER_EMAIL, domain: TENANT_DOMAIN },
		items: {
			data: [{ price: { id: PRO_PRICE_ID }, current_period_end: CURRENT_PERIOD_END }]
		},
		...overrides
	};
}

function makeSubscriptionEvent(
	type: 'customer.subscription.updated' | 'customer.subscription.deleted',
	subscriptionOverrides: Record<string, unknown> = {}
) {
	const subscriptionObject = makeSubscriptionObject(subscriptionOverrides);
	return {
		id: `evt_test_${type.replace(/\./g, '_')}`,
		object: 'event',
		type,
		created: 1771552254,
		livemode: false,
		data: { object: subscriptionObject }
	};
}

function makeSubscriptionRequest(
	type: 'customer.subscription.updated' | 'customer.subscription.deleted',
	subscriptionOverrides: Record<string, unknown> = {}
) {
	const event = makeSubscriptionEvent(type, subscriptionOverrides);
	return makeRequest({ body: JSON.stringify(event) });
}

// ---------------------------------------------------------------------------
// customer.subscription.updated
// ---------------------------------------------------------------------------
describe('POST /api/stripe/webhook — customer.subscription.updated', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		delete process.env.NEXT_STRIPE_ALERT_EMAILS;
		mockRecordStripeEventOutcome.mockResolvedValue(undefined);
		mockSendStripeWebhookErrorNotification.mockResolvedValue(undefined);
		mockSendUpcomingRenewalEmail.mockResolvedValue(undefined);
		mockCreateEmailSenderService.mockReturnValue({
			sendStripeWebhookErrorNotification: mockSendStripeWebhookErrorNotification,
			sendUpcomingRenewalEmail: mockSendUpcomingRenewalEmail
		});
		mockGetByHostname.mockResolvedValue(makeTenantRegistry());
		mockSaveStripeEvent.mockResolvedValue(undefined);
		mockFindByEmail.mockResolvedValue(makeUser());
		mockUpdatePlan.mockResolvedValue(undefined);
		mockUpdateSubscriptionFlags.mockResolvedValue(undefined);
	});

	it('detects scheduled cancellation via cancel_at_period_end and syncs planExpiredAt', async () => {
		const event = makeSubscriptionEvent('customer.subscription.updated', {
			cancel_at_period_end: true
		});
		mockConstructEvent.mockReturnValue(event);
		const res = await POST(makeSubscriptionRequest('customer.subscription.updated', { cancel_at_period_end: true }));

		expect(res.status).toBe(200);
		expect(mockUpdatePlan).toHaveBeenCalledWith(TENANT_ID, USER_ID, 'pro', CURRENT_PERIOD_END * 1000);
		expect(mockUpdateSubscriptionFlags).toHaveBeenCalledWith(TENANT_ID, USER_ID, {
			subscriptionCancelAtPeriodEnd: true
		});
	});

	it('detects scheduled cancellation via cancel_at (Customer Portal flow)', async () => {
		// Customer Portal sets cancel_at with cancel_at_period_end: false — the previous code missed this
		const event = makeSubscriptionEvent('customer.subscription.updated', {
			cancel_at_period_end: false,
			cancel_at: CURRENT_PERIOD_END
		});
		mockConstructEvent.mockReturnValue(event);
		const res = await POST(
			makeSubscriptionRequest('customer.subscription.updated', {
				cancel_at_period_end: false,
				cancel_at: CURRENT_PERIOD_END
			})
		);

		expect(res.status).toBe(200);
		expect(mockUpdatePlan).toHaveBeenCalledWith(TENANT_ID, USER_ID, 'pro', CURRENT_PERIOD_END * 1000);
		expect(mockUpdateSubscriptionFlags).toHaveBeenCalledWith(TENANT_ID, USER_ID, {
			subscriptionCancelAtPeriodEnd: true
		});
	});

	it('flags past_due status without downgrading the plan', async () => {
		const event = makeSubscriptionEvent('customer.subscription.updated', { status: 'past_due' });
		mockConstructEvent.mockReturnValue(event);
		const res = await POST(makeSubscriptionRequest('customer.subscription.updated', { status: 'past_due' }));

		expect(res.status).toBe(200);
		expect(mockUpdateSubscriptionFlags).toHaveBeenCalledWith(TENANT_ID, USER_ID, {
			subscriptionStatus: 'past_due'
		});
		expect(mockUpdatePlan).not.toHaveBeenCalled();
	});

	it('downgrades to free and clears flags on unpaid status', async () => {
		const event = makeSubscriptionEvent('customer.subscription.updated', { status: 'unpaid' });
		mockConstructEvent.mockReturnValue(event);
		const res = await POST(makeSubscriptionRequest('customer.subscription.updated', { status: 'unpaid' }));

		expect(res.status).toBe(200);
		expect(mockUpdatePlan).toHaveBeenCalledWith(TENANT_ID, USER_ID, 'free', null);
		expect(mockUpdateSubscriptionFlags).toHaveBeenCalledWith(TENANT_ID, USER_ID, {
			subscriptionCancelAtPeriodEnd: null,
			subscriptionStatus: null
		});
	});

	it('upgrades plan on active renewal when priceId matches', async () => {
		const event = makeSubscriptionEvent('customer.subscription.updated');
		mockConstructEvent.mockReturnValue(event);
		const res = await POST(makeSubscriptionRequest('customer.subscription.updated'));

		expect(res.status).toBe(200);
		expect(mockUpdatePlan).toHaveBeenCalledWith(
			TENANT_ID,
			USER_ID,
			'pro',
			CURRENT_PERIOD_END * 1000,
			undefined,
			'month' // billingInterval defaults to 'month' when metadata.interval is absent
		);
	});

	it('returns 200 and skips updates when tenantId/email are missing from metadata', async () => {
		// domain must be present for the route to resolve the tenant; tenantId/email missing → early return in handler
		const partialMeta = { domain: TENANT_DOMAIN };
		const event = makeSubscriptionEvent('customer.subscription.updated', { metadata: partialMeta });
		mockConstructEvent.mockReturnValue(event);
		const res = await POST(makeSubscriptionRequest('customer.subscription.updated', { metadata: partialMeta }));

		expect(res.status).toBe(200);
		expect(mockFindByEmail).not.toHaveBeenCalled();
		expect(mockUpdatePlan).not.toHaveBeenCalled();
	});

	it('returns 200 when user is not found (safe degradation)', async () => {
		mockFindByEmail.mockResolvedValue(null);
		const event = makeSubscriptionEvent('customer.subscription.updated', { cancel_at_period_end: true });
		mockConstructEvent.mockReturnValue(event);
		const res = await POST(makeSubscriptionRequest('customer.subscription.updated', { cancel_at_period_end: true }));

		expect(res.status).toBe(200);
		expect(mockUpdateSubscriptionFlags).not.toHaveBeenCalled();
	});

	it('clears subscriptionCancelAtPeriodEnd when subscription is reactivated', async () => {
		// True reactivation: both cancel_at_period_end and cancel_at must be falsy
		mockFindByEmail.mockResolvedValue({ ...makeUser(), subscriptionCancelAtPeriodEnd: true });
		const event = makeSubscriptionEvent('customer.subscription.updated', {
			cancel_at_period_end: false,
			cancel_at: null
		});
		mockConstructEvent.mockReturnValue(event);
		const res = await POST(
			makeSubscriptionRequest('customer.subscription.updated', {
				cancel_at_period_end: false,
				cancel_at: null
			})
		);

		expect(res.status).toBe(200);
		expect(mockUpdateSubscriptionFlags).toHaveBeenCalledWith(TENANT_ID, USER_ID, {
			subscriptionCancelAtPeriodEnd: null
		});
	});
});

// ---------------------------------------------------------------------------
// customer.subscription.deleted
// ---------------------------------------------------------------------------
describe('POST /api/stripe/webhook — customer.subscription.deleted', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		delete process.env.NEXT_STRIPE_ALERT_EMAILS;
		mockRecordStripeEventOutcome.mockResolvedValue(undefined);
		mockSendStripeWebhookErrorNotification.mockResolvedValue(undefined);
		mockSendUpcomingRenewalEmail.mockResolvedValue(undefined);
		mockCreateEmailSenderService.mockReturnValue({
			sendStripeWebhookErrorNotification: mockSendStripeWebhookErrorNotification,
			sendUpcomingRenewalEmail: mockSendUpcomingRenewalEmail
		});
		mockGetByHostname.mockResolvedValue(makeTenantRegistry());
		mockSaveStripeEvent.mockResolvedValue(undefined);
		mockFindByEmail.mockResolvedValue(makeUser());
		mockUpdatePlan.mockResolvedValue(undefined);
		mockUpdateSubscriptionFlags.mockResolvedValue(undefined);
	});

	it('downgrades user to free and clears subscription flags', async () => {
		const event = makeSubscriptionEvent('customer.subscription.deleted');
		mockConstructEvent.mockReturnValue(event);
		const res = await POST(makeSubscriptionRequest('customer.subscription.deleted'));

		expect(res.status).toBe(200);
		expect(mockFindByEmail).toHaveBeenCalledWith(TENANT_ID, USER_EMAIL);
		expect(mockUpdatePlan).toHaveBeenCalledWith(TENANT_ID, USER_ID, 'free', null);
		expect(mockUpdateSubscriptionFlags).toHaveBeenCalledWith(TENANT_ID, USER_ID, {
			subscriptionCancelAtPeriodEnd: null,
			subscriptionStatus: null
		});
	});

	it('returns 200 and skips updates when tenantId/email are missing from metadata', async () => {
		// domain must be present for the route to resolve the tenant; tenantId/email missing → early return in handler
		const partialMeta = { domain: TENANT_DOMAIN };
		const event = makeSubscriptionEvent('customer.subscription.deleted', { metadata: partialMeta });
		mockConstructEvent.mockReturnValue(event);
		const res = await POST(makeSubscriptionRequest('customer.subscription.deleted', { metadata: partialMeta }));

		expect(res.status).toBe(200);
		expect(mockFindByEmail).not.toHaveBeenCalled();
		expect(mockUpdatePlan).not.toHaveBeenCalled();
	});

	it('returns 200 when user is not found (safe degradation)', async () => {
		mockFindByEmail.mockResolvedValue(null);
		const event = makeSubscriptionEvent('customer.subscription.deleted');
		mockConstructEvent.mockReturnValue(event);
		const res = await POST(makeSubscriptionRequest('customer.subscription.deleted'));

		expect(res.status).toBe(200);
		expect(mockUpdatePlan).not.toHaveBeenCalled();
		expect(mockUpdateSubscriptionFlags).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// invoice.payment_succeeded — domain from URL query param (invoices carry no metadata)
// ---------------------------------------------------------------------------
describe('POST /api/stripe/webhook — invoice.payment_succeeded via ?tenant= query param', () => {
	const INVOICE_SUBSCRIPTION_ID = SUBSCRIPTION_ID;

	function makeInvoiceEvent() {
		return {
			id: 'evt_test_invoice_payment_succeeded',
			object: 'event',
			type: 'invoice.payment_succeeded',
			created: 1771552254,
			livemode: false,
			data: {
				object: {
					// Invoices carry no domain metadata — this is the root cause of the 400 bug
					metadata: {},
					amount_due: 19900,
					currency: 'mxn',
					next_payment_attempt: 1774144254,
					parent: {
						subscription_details: {
							subscription: INVOICE_SUBSCRIPTION_ID
						}
					}
				}
			}
		};
	}

	beforeEach(() => {
		vi.clearAllMocks();
		delete process.env.NEXT_STRIPE_ALERT_EMAILS;
		mockRecordStripeEventOutcome.mockResolvedValue(undefined);
		mockSendStripeWebhookErrorNotification.mockResolvedValue(undefined);
		mockSendUpcomingRenewalEmail.mockResolvedValue(undefined);
		mockCreateEmailSenderService.mockReturnValue({
			sendStripeWebhookErrorNotification: mockSendStripeWebhookErrorNotification,
			sendUpcomingRenewalEmail: mockSendUpcomingRenewalEmail
		});
		mockGetByHostname.mockResolvedValue(makeTenantRegistry());
		mockSaveStripeEvent.mockResolvedValue(undefined);
		mockFindByEmail.mockResolvedValue(makeUser());
		mockUpdatePlan.mockResolvedValue(undefined);
		mockSubscriptionsRetrieve.mockResolvedValue({
			id: INVOICE_SUBSCRIPTION_ID,
			metadata: { tenantId: TENANT_ID, email: USER_EMAIL, domain: TENANT_DOMAIN },
			items: {
				data: [{ price: { id: PRO_PRICE_ID }, current_period_end: CURRENT_PERIOD_END }]
			}
		});
	});

	it('returns 200 without ?tenant= param because invoice has no metadata.domain', async () => {
		// This was the root-cause 400 bug: invoice events never had domain in metadata
		const event = makeInvoiceEvent();
		mockConstructEvent.mockReturnValue(event);
		const body = JSON.stringify(event);
		const res = await POST(makeRequest({ body })); // no tenant param
		expect(res.status).toBe(200);
		// Tenant lookup must NOT have been called (domain was unresolvable → graceful skip)
		expect(mockGetByHostname).not.toHaveBeenCalled();
	});

	it('processes invoice and renews user plan when ?tenant= param is present', async () => {
		const event = makeInvoiceEvent();
		mockConstructEvent.mockReturnValue(event);
		const body = JSON.stringify(event);
		const res = await POST(makeRequest({ body, tenant: TENANT_DOMAIN }));

		expect(res.status).toBe(200);
		expect(mockGetByHostname).toHaveBeenCalledWith(TENANT_DOMAIN);
		expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith(INVOICE_SUBSCRIPTION_ID);
		// invoice renewals don't pass stripeSubscriptionId (undefined 5th arg); billingInterval defaults to 'month'
		expect(mockUpdatePlan).toHaveBeenCalledWith(
			TENANT_ID,
			USER_ID,
			'pro',
			CURRENT_PERIOD_END * 1000,
			undefined,
			'month'
		);
	});
});
