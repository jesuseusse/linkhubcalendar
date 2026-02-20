import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { container } from '@/infrastructure/container';
import { StripeConfig } from '@/interfaces/IStripeConfig';

export async function POST(req: NextRequest) {
	// 1. Identify tenant via ?domain= query param (each tenant registers their own webhook URL)
	const domain = req.nextUrl.searchParams.get('domain');
	if (!domain) {
		return NextResponse.json({ error: 'Missing domain param' }, { status: 400 });
	}

	// 2. Resolve tenant registry — reads stripeConfig and tenantId
	const tenantRegistry = await container.tenantRegistryRepo.getByHostname(domain);
	if (!tenantRegistry) {
		return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
	}

	const { stripeConfig } = tenantRegistry;

	if (!stripeConfig?.secretKey || !stripeConfig?.webhookSecret) {
		return NextResponse.json(
			{ error: 'Stripe not configured for this tenant' },
			{ status: 400 }
		);
	}

	// 3. Verify Stripe webhook signature with tenant-specific secret
	const stripe = new Stripe(stripeConfig.secretKey);
	const sig = req.headers.get('stripe-signature');
	const rawBody = await req.text();

	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(rawBody, sig!, stripeConfig.webhookSecret);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Signature mismatch';
		return NextResponse.json(
			{ error: `Webhook signature verification failed: ${message}` },
			{ status: 400 }
		);
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

			case 'invoice.payment_succeeded':
				await handleInvoicePaymentSucceeded(
					stripe,
					event.data.object as Stripe.Invoice,
					stripeConfig
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
// session.metadata carries { email, tenantId, domain } set at checkout creation.
// ---------------------------------------------------------------------------
async function handleCheckoutCompleted(
	stripe: Stripe,
	session: Stripe.Checkout.Session,
	hostname: string,
	stripeConfig: StripeConfig
) {
	const { email, tenantId, domain } = session.metadata ?? {};
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

	// Propagate metadata to the subscription so future renewal events can resolve the tenant
	await stripe.subscriptions.update(subscriptionId, {
		metadata: { tenantId, domain: domain ?? hostname, email }
	});

	if (priceId !== stripeConfig.proPriceId) {
		console.log(
			`[stripe-webhook] priceId ${priceId} ≠ proPriceId ${stripeConfig.proPriceId} — skipping upgrade`
		);
		return;
	}

	if (!currentPeriodEnd) return;

	await updateUserPlan(tenantId, email, 'pro', currentPeriodEnd * 1000);
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

	// In Stripe v20, current_period_end is on SubscriptionItem, not Subscription
	const item = subscription.items.data[0];
	const priceId = item?.price?.id;
	const currentPeriodEnd = item?.current_period_end;

	if (priceId !== stripeConfig.proPriceId || !currentPeriodEnd) return;

	await updateUserPlan(tenantId, email, 'pro', currentPeriodEnd * 1000);
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

	if (priceId !== stripeConfig.proPriceId || !currentPeriodEnd) return;

	await updateUserPlan(tenantId, email, 'pro', currentPeriodEnd * 1000);
}

// ---------------------------------------------------------------------------
// Shared helper — finds user by email within tenant and upgrades their plan.
// planExpiredAt is milliseconds (JS convention); Stripe currentPeriodEnd is seconds.
// ---------------------------------------------------------------------------
async function updateUserPlan(
	tenantId: string,
	email: string,
	plan: string,
	planExpiredAt: number
) {
	const user = await container.userRepo.findByEmail(tenantId, email);
	if (!user) {
		console.warn(
			`[stripe-webhook] No user found — tenantId: ${tenantId}, email: ${email}`
		);
		return;
	}

	await container.userRepo.updatePlan(tenantId, user.id, plan, planExpiredAt);
	console.log(
		`[stripe-webhook] Updated user ${email} (tenant ${tenantId}) → plan: ${plan}, expires: ${new Date(planExpiredAt).toISOString()}`
	);
}
