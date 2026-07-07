import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { container } from '@/infrastructure/container';
import { StripeConfig } from '@/interfaces/IStripeConfig';
import { createEmailSenderService } from '@/infrastructure/services/emailSenderFactory';

// ---------------------------------------------------------------------------
// Typed error responses — prevents ad-hoc { error: string } objects
// ---------------------------------------------------------------------------
type WebhookErrorCode =
	| 'INVALID_JSON'
	| 'TENANT_NOT_FOUND'
	| 'STRIPE_NOT_CONFIGURED'
	| 'SIGNATURE_MISMATCH';

interface WebhookErrorResponse {
	code: WebhookErrorCode;
	message: string;
}

function webhookError(
	code: WebhookErrorCode,
	message: string,
	status: number
): NextResponse<WebhookErrorResponse> {
	return NextResponse.json({ code, message }, { status });
}

// Partial Stripe event shape — only the fields read before signature verification.
interface RawStripeEvent {
	type?: string;
	data?: { object?: { metadata?: Record<string, string> } };
}

export async function POST(req: NextRequest) {
	const rawBody = await req.text();

	// 1. Parse body without verification to extract domain.
	//    Domain identifies which tenant's Stripe config to use for signature verification.
	let parsedBody: RawStripeEvent | undefined;
	try {
		parsedBody = JSON.parse(rawBody);
	} catch {
		return webhookError('INVALID_JSON', 'Invalid JSON body', 400);
	}

	// Domain resolution: URL query param takes precedence (works for all event types,
	// including invoices which don't carry metadata). Falls back to subscription/session
	// metadata for backward compatibility with events already in flight.
	const domain =
		req.nextUrl.searchParams.get('tenant') ||
		parsedBody?.data?.object?.metadata?.domain;

	if (!domain) {
		// Cannot resolve tenant — returning 200 to stop Stripe retries (permanent failure).
		console.warn(
			'[stripe-webhook] Could not resolve tenant domain — event skipped:',
			parsedBody?.type
		);
		return NextResponse.json({ received: true });
	}

	// 2. Resolve tenant registry — reads stripeConfig and tenantId
	const tenantRegistry = await container.tenantRegistryRepo.getByHostname(domain);
	if (!tenantRegistry) {
		return webhookError('TENANT_NOT_FOUND', `Tenant not found: ${domain}`, 404);
	}

	const { stripeConfig } = tenantRegistry;

	if (!stripeConfig?.secretKey || !stripeConfig?.webhookSecret) {
		return webhookError('STRIPE_NOT_CONFIGURED', 'Stripe not configured for this tenant', 400);
	}

	// 3. Verify Stripe webhook signature with tenant-specific secret
	const stripe = new Stripe(stripeConfig.secretKey);
	const sig = req.headers.get('stripe-signature');

	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(rawBody, sig!, stripeConfig.webhookSecret);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Signature mismatch';
		return webhookError('SIGNATURE_MISMATCH', `Webhook signature verification failed: ${message}`, 400);
	}

	// 4. Persist full event object (idempotent — uses event.id as doc ID)
	await container.tenantRegistryRepo.saveStripeEvent(domain, event.id, {
		...event,
		receivedAt: Date.now()
	});

	// 5. Process event — errors are swallowed so Stripe receives 200 and doesn't retry
	try {
		switch (event.type) {
			case 'checkout.session.completed':
				await handleCheckoutCompleted(
					stripe,
					event.data.object as Stripe.Checkout.Session,
					domain,
					stripeConfig
				);
				break;

			case 'customer.subscription.updated':
				await handleSubscriptionUpdated(
					event.data.object as Stripe.Subscription,
					stripeConfig
				);
				break;

			case 'customer.subscription.deleted':
				await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
				break;

			case 'invoice.payment_succeeded':
				await handleInvoicePaymentSucceeded(
					stripe,
					event.data.object as Stripe.Invoice,
					stripeConfig
				);
				break;

			case 'invoice.upcoming':
				await handleInvoiceUpcoming(
					stripe,
					event.data.object as Stripe.Invoice,
					tenantRegistry
				);
				break;
		}
	} catch (err) {
		console.error(`[stripe-webhook] Error processing ${event.type} (${event.id}):`, err);
	}

	return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// checkout.session.completed
// Fired right after a user completes the Stripe checkout flow.
// session.metadata carries { email, tenantId, domain, interval } set at checkout creation.
// ---------------------------------------------------------------------------
async function handleCheckoutCompleted(
	stripe: Stripe,
	session: Stripe.Checkout.Session,
	domain: string,
	stripeConfig: StripeConfig
) {
	const { email, tenantId, interval } = session.metadata ?? {};
	if (!email || !tenantId) {
		console.warn('[stripe-webhook] checkout.session.completed: missing metadata');
		return;
	}

	const subscriptionId =
		typeof session.subscription === 'string' ? session.subscription : null;
	if (!subscriptionId) return;

	// Fetch subscription to get priceId and billing period end
	// In Stripe v20, current_period_end is on SubscriptionItem, not Subscription
	const subscription = await stripe.subscriptions.retrieve(subscriptionId);
	const item = subscription.items.data[0];
	const priceId = item?.price?.id;
	const currentPeriodEnd = item?.current_period_end; // Unix seconds

	const billingInterval: 'month' | 'year' = interval === 'year' ? 'year' : 'month';

	// Propagate metadata to the subscription so future renewal events can resolve the tenant
	await stripe.subscriptions.update(subscriptionId, {
		metadata: { tenantId, domain, email, interval: billingInterval }
	});

	const isProPrice =
		priceId === stripeConfig.proPriceId ||
		(stripeConfig.proAnnualPriceId && priceId === stripeConfig.proAnnualPriceId);

	if (!isProPrice) {
		console.log(
			`[stripe-webhook] priceId ${priceId} does not match any configured pro price — skipping upgrade`
		);
		return;
	}

	if (!currentPeriodEnd) return;

	await updateUserPlan(tenantId, email, 'pro', currentPeriodEnd * 1000, subscriptionId, billingInterval);
}

// ---------------------------------------------------------------------------
// customer.subscription.updated
// Fired on plan changes, renewals, and cancellations.
// Relies on metadata being set during checkout.session.completed processing.
// ---------------------------------------------------------------------------
async function handleSubscriptionUpdated(
	subscription: Stripe.Subscription,
	stripeConfig: StripeConfig
) {
	const { tenantId, email } = subscription.metadata ?? {};
	if (!tenantId || !email) return; // metadata not yet set (handled in checkout.session.completed)

	const user = await container.userRepo.findByEmail(tenantId, email);
	if (!user) {
		console.warn(`[stripe-webhook] No user found — tenantId: ${tenantId}, email: ${email}`);
		return;
	}

	// Stripe uses EITHER cancel_at_period_end OR cancel_at to schedule a future cancellation.
	// The Customer Portal sets cancel_at (a specific date) with cancel_at_period_end: false,
	// so we must check both fields to correctly detect a scheduled cancellation.
	const cancelAt = subscription.cancel_at; // number | null
	const isCancellationScheduled = subscription.cancel_at_period_end || cancelAt != null;

	if (isCancellationScheduled) {
		const item = subscription.items.data[0];
		const expiryTs = cancelAt ?? item?.current_period_end ?? null;
		if (expiryTs) {
			// Sync planExpiredAt so "Acceso hasta" in BillingClient shows the correct date
			await container.userRepo.updatePlan(tenantId, user.id, 'pro', expiryTs * 1000);
		}
		await container.userRepo.updateSubscriptionFlags(tenantId, user.id, {
			subscriptionCancelAtPeriodEnd: true
		});
		console.log(
			`[stripe-webhook] Subscription scheduled for cancellation — ${email} (tenant ${tenantId})`
		);
		return;
	}

	// True reactivation: user cancelled their scheduled cancellation in the portal.
	// Requires both cancel_at_period_end === false AND cancel_at === null.
	if (user.subscriptionCancelAtPeriodEnd && cancelAt == null) {
		await container.userRepo.updateSubscriptionFlags(tenantId, user.id, {
			subscriptionCancelAtPeriodEnd: null
		});
		console.log(
			`[stripe-webhook] Subscription reactivated — cleared cancel flag for ${email} (tenant ${tenantId})`
		);
	}

	// Immediate downgrade on unpaid (multiple payment retries exhausted)
	if (subscription.status === 'unpaid') {
		await container.userRepo.updatePlan(tenantId, user.id, 'free', null);
		await container.userRepo.updateSubscriptionFlags(tenantId, user.id, {
			subscriptionCancelAtPeriodEnd: null,
			subscriptionStatus: null
		});
		console.log(
			`[stripe-webhook] Subscription unpaid — downgraded ${email} (tenant ${tenantId}) to free`
		);
		return;
	}

	// Flag past_due without downgrading (payment failed, retrying)
	if (subscription.status === 'past_due') {
		await container.userRepo.updateSubscriptionFlags(tenantId, user.id, {
			subscriptionStatus: 'past_due'
		});
		console.log(`[stripe-webhook] Subscription past_due — flagged ${email} (tenant ${tenantId})`);
		return;
	}

	// Renewal / plan change — existing logic
	// In Stripe v20, current_period_end is on SubscriptionItem, not Subscription
	const item = subscription.items.data[0];
	const priceId = item?.price?.id;
	const currentPeriodEnd = item?.current_period_end;

	const isProPrice =
		priceId === stripeConfig.proPriceId ||
		(stripeConfig.proAnnualPriceId && priceId === stripeConfig.proAnnualPriceId);

	if (!isProPrice || !currentPeriodEnd) return;

	const billingInterval: 'month' | 'year' =
		subscription.metadata?.interval === 'year' ? 'year' : 'month';

	await container.userRepo.updatePlan(tenantId, user.id, 'pro', currentPeriodEnd * 1000, undefined, billingInterval);
	console.log(
		`[stripe-webhook] Updated user ${email} (tenant ${tenantId}) → plan: pro, interval: ${billingInterval}, expires: ${new Date(currentPeriodEnd * 1000).toISOString()}`
	);
}

// ---------------------------------------------------------------------------
// customer.subscription.deleted
// Fired when a subscription is fully cancelled (period ends or immediate cancel).
// Downgrades the user to free and clears any subscription flags.
// ---------------------------------------------------------------------------
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	const { tenantId, email } = subscription.metadata ?? {};
	if (!tenantId || !email) return;

	const user = await container.userRepo.findByEmail(tenantId, email);
	if (!user) {
		console.warn(`[stripe-webhook] No user found — tenantId: ${tenantId}, email: ${email}`);
		return;
	}

	await container.userRepo.updatePlan(tenantId, user.id, 'free', null);
	await container.userRepo.updateSubscriptionFlags(tenantId, user.id, {
		subscriptionCancelAtPeriodEnd: null,
		subscriptionStatus: null
	});
	console.log(
		`[stripe-webhook] Subscription deleted — downgraded ${email} (tenant ${tenantId}) to free`
	);
}

// ---------------------------------------------------------------------------
// invoice.payment_succeeded
// Fired every time a subscription payment is collected (initial + renewals).
// In Stripe v20, subscription ID is at invoice.parent.subscription_details.subscription
// ---------------------------------------------------------------------------
async function handleInvoicePaymentSucceeded(
	stripe: Stripe,
	invoice: Stripe.Invoice,
	stripeConfig: StripeConfig
) {
	// In Stripe v20, invoice.subscription was moved to invoice.parent.subscription_details
	const subscriptionRef = invoice.parent?.subscription_details?.subscription;
	const subscriptionId =
		typeof subscriptionRef === 'string'
			? subscriptionRef
			: subscriptionRef != null && typeof subscriptionRef === 'object'
				? (subscriptionRef as Stripe.Subscription).id
				: null;
	if (!subscriptionId) return;

	const subscription = await stripe.subscriptions.retrieve(subscriptionId);
	const { tenantId, email } = subscription.metadata ?? {};
	if (!tenantId || !email) return;

	// In Stripe v20, current_period_end is on SubscriptionItem, not Subscription
	const item = subscription.items.data[0];
	const priceId = item?.price?.id;
	const currentPeriodEnd = item?.current_period_end;

	const isProPrice =
		priceId === stripeConfig.proPriceId ||
		(stripeConfig.proAnnualPriceId && priceId === stripeConfig.proAnnualPriceId);

	if (!isProPrice || !currentPeriodEnd) return;

	const billingInterval: 'month' | 'year' =
		subscription.metadata?.interval === 'year' ? 'year' : 'month';

	await updateUserPlan(tenantId, email, 'pro', currentPeriodEnd * 1000, undefined, billingInterval);
}

// ---------------------------------------------------------------------------
// invoice.upcoming
// Fired ~3 days before a subscription renewal (configurable in Stripe dashboard).
// Sends a reminder email to the subscriber so they know the charge is coming.
// ---------------------------------------------------------------------------
async function handleInvoiceUpcoming(
	stripe: Stripe,
	invoice: Stripe.Invoice,
	tenantRegistry: Awaited<ReturnType<typeof container.tenantRegistryRepo.getByHostname>>
) {
	if (!tenantRegistry) return;

	// Resolve subscription to get metadata (tenantId, email)
	const subscriptionRef = invoice.parent?.subscription_details?.subscription;
	const subscriptionId =
		typeof subscriptionRef === 'string'
			? subscriptionRef
			: subscriptionRef != null && typeof subscriptionRef === 'object'
				? (subscriptionRef as Stripe.Subscription).id
				: null;
	if (!subscriptionId) return;

	const subscription = await stripe.subscriptions.retrieve(subscriptionId);
	const { email } = subscription.metadata ?? {};
	if (!email) return;

	// Format amount and renewal date from invoice
	const amountCents = invoice.amount_due ?? 0;
	const currency = (invoice.currency ?? 'mxn').toUpperCase();
	const amountFormatted = new Intl.NumberFormat('es-MX', {
		style: 'currency',
		currency,
		minimumFractionDigits: 2
	}).format(amountCents / 100);

	const nextPaymentAttempt = invoice.next_payment_attempt;
	const renewalDate = nextPaymentAttempt
		? new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
				.format(new Date(nextPaymentAttempt * 1000))
		: '—';

	const emailService = createEmailSenderService(tenantRegistry);
	const config = {
		tenantId: tenantRegistry.tenantId,
		apiKey: tenantRegistry.resendApiKey ?? tenantRegistry.sesConfig?.accessKeyId ?? '',
		fromEmail: tenantRegistry.resendFromEmail ?? tenantRegistry.sesConfig?.fromEmail ?? ''
	};
	const companyName = tenantRegistry.seoConfig?.siteName ?? tenantRegistry.companyName ?? 'LinkHub';

	await emailService.sendUpcomingRenewalEmail(config, { email, amountFormatted, renewalDate }, companyName);
	console.log(`[stripe-webhook] invoice.upcoming — renewal reminder sent to ${email}`);
}

// ---------------------------------------------------------------------------
// Shared helper — finds user by email within tenant and upgrades their plan.
// planExpiredAt is milliseconds (JS convention); Stripe currentPeriodEnd is seconds.
// ---------------------------------------------------------------------------
async function updateUserPlan(
	tenantId: string,
	email: string,
	plan: string,
	planExpiredAt: number,
	stripeSubscriptionId?: string | null,
	billingInterval?: 'month' | 'year'
) {
	const user = await container.userRepo.findByEmail(tenantId, email);
	if (!user) {
		console.warn(
			`[stripe-webhook] No user found — tenantId: ${tenantId}, email: ${email}`
		);
		return;
	}

	await container.userRepo.updatePlan(tenantId, user.id, plan, planExpiredAt, stripeSubscriptionId, billingInterval);
	console.log(
		`[stripe-webhook] Updated user ${email} (tenant ${tenantId}) → plan: ${plan}, interval: ${billingInterval ?? 'month'}, expires: ${new Date(planExpiredAt).toISOString()}`
	);
}
