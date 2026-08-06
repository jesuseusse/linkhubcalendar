import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { container } from '@/infrastructure/container';
import { StripeConfig } from '@/interfaces/IStripeConfig';
import { TenantRegistryData } from '@/interfaces/ITenantRegistryData';
import { IEmailSenderService, EmailSenderConfig } from '@/domain/interfaces/IEmailSenderService';
import { createEmailSenderService } from '@/infrastructure/services/emailSenderFactory';
import { resolveProInterval, ProBillingInterval } from '@/lib/stripe/resolveProInterval';
import {
	WebhookProcessingError,
	ClassifiedWebhookFailure,
	classifyWebhookFailure,
	callStripeApi
} from './webhookErrors';

// ---------------------------------------------------------------------------
// Typed error responses — prevents ad-hoc { error: string } objects
// ---------------------------------------------------------------------------
type WebhookErrorCode =
	| 'INVALID_JSON'
	| 'TENANT_NOT_FOUND'
	| 'STRIPE_NOT_CONFIGURED'
	| 'SIGNATURE_MISMATCH'
	| 'PROCESSING_ERROR';

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

	// 5. Process event.
	//
	// Failures are classified as retryable or not (see webhookErrors.ts):
	//   - retryable   → 5xx, so Stripe retries with backoff (up to 3 days) in case the
	//                   underlying issue (Stripe API hiccup, transient Firestore error)
	//                   was transient and self-heals.
	//   - non-retryable → 200, so Stripe stops retrying immediately. Retrying the same
	//                   event can never fix a price-ID mismatch or a missing user — a
	//                   human has to act, which is exactly what the alert email is for.
	// In both cases the outcome is persisted onto the stripe_events doc and an alert
	// email fires, so "Stripe shows 200" never again silently means "nothing happened."
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

		await container.tenantRegistryRepo
			.recordStripeEventOutcome(domain, event.id, { status: 'processed' })
			.catch(() => {});
	} catch (err) {
		const failure = classifyWebhookFailure(err);
		console.error(
			`[stripe-webhook] ${failure.reason} processing ${event.type} (${event.id}): ${failure.message}`,
			failure.context
		);

		await container.tenantRegistryRepo
			.recordStripeEventOutcome(domain, event.id, {
				status: 'failed',
				reason: failure.reason,
				retryable: failure.retryable,
				message: failure.message
			})
			.catch(() => {});

		// Fire-and-forget — alert delivery must never block or fail the Stripe response.
		sendWebhookFailureAlert(tenantRegistry, domain, event, failure).catch(() => {});

		if (failure.retryable) {
			return webhookError('PROCESSING_ERROR', `${failure.reason}: ${failure.message}`, 500);
		}
		// Non-retryable falls through to the 200 below — see comment above.
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
	const { email, tenantId, interval: requestedInterval } = session.metadata ?? {};
	if (!email || !tenantId) {
		throw new WebhookProcessingError(
			'MISSING_METADATA',
			'checkout.session.completed is missing email/tenantId metadata',
			{ retryable: false, context: { sessionId: session.id } }
		);
	}

	const subscriptionId =
		typeof session.subscription === 'string' ? session.subscription : null;
	if (!subscriptionId) {
		throw new WebhookProcessingError(
			'MISSING_SUBSCRIPTION_DATA',
			'checkout.session.completed has no subscription ID (mode was not "subscription"?)',
			{ retryable: false, context: { sessionId: session.id } }
		);
	}

	// Fetch subscription to get priceId and billing period end
	// In Stripe v20, current_period_end is on SubscriptionItem, not Subscription
	const subscription = await callStripeApi('subscriptions.retrieve', () =>
		stripe.subscriptions.retrieve(subscriptionId)
	);
	const item = subscription.items.data[0];
	const priceId = item?.price?.id;
	const currentPeriodEnd = item?.current_period_end; // Unix seconds

	// The live Stripe price is the only source of truth for month vs. year — see
	// resolveProInterval's docstring for why metadata.interval is not trusted here.
	const billingInterval = resolveProInterval(priceId, stripeConfig);

	// Propagate metadata to the subscription so future renewal events can resolve the
	// tenant. `interval` mirrors what the client originally requested, kept only for
	// debugging — it is never used for billing decisions.
	await callStripeApi('subscriptions.update', () =>
		stripe.subscriptions.update(subscriptionId, {
			metadata: { tenantId, domain, email, interval: requestedInterval === 'year' ? 'year' : 'month' }
		})
	);

	if (!billingInterval) {
		throw new WebhookProcessingError(
			'PRICE_ID_MISMATCH',
			`priceId "${priceId}" does not match proPriceId or proAnnualPriceId configured for this tenant`,
			{
				retryable: false,
				context: {
					priceId,
					proPriceId: stripeConfig.proPriceId,
					proAnnualPriceId: stripeConfig.proAnnualPriceId,
					subscriptionId
				}
			}
		);
	}

	if (!currentPeriodEnd) {
		throw new WebhookProcessingError(
			'MISSING_SUBSCRIPTION_DATA',
			'Subscription item has no current_period_end',
			{ retryable: false, context: { subscriptionId } }
		);
	}

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
	if (!tenantId || !email) {
		// Expected only for subscriptions created before the metadata-at-creation
		// pattern existed. Not alerted — retrying won't add metadata that isn't there.
		console.warn(
			`[stripe-webhook] customer.subscription.updated missing tenantId/email metadata — subscription ${subscription.id}`
		);
		return;
	}

	const user = await container.userRepo.findByEmail(tenantId, email);
	if (!user) {
		throw new WebhookProcessingError(
			'USER_NOT_FOUND',
			`No user found for tenantId=${tenantId} email=${email}`,
			{ retryable: false, context: { tenantId, email, subscriptionId: subscription.id } }
		);
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

	// Renewal / plan change
	// In Stripe v20, current_period_end is on SubscriptionItem, not Subscription
	const item = subscription.items.data[0];
	const priceId = item?.price?.id;
	const currentPeriodEnd = item?.current_period_end;
	const billingInterval = resolveProInterval(priceId, stripeConfig);

	if (!billingInterval) {
		throw new WebhookProcessingError(
			'PRICE_ID_MISMATCH',
			`priceId "${priceId}" does not match proPriceId or proAnnualPriceId configured for this tenant`,
			{
				retryable: false,
				context: {
					priceId,
					proPriceId: stripeConfig.proPriceId,
					proAnnualPriceId: stripeConfig.proAnnualPriceId,
					subscriptionId: subscription.id
				}
			}
		);
	}

	if (!currentPeriodEnd) {
		throw new WebhookProcessingError(
			'MISSING_SUBSCRIPTION_DATA',
			'Subscription item has no current_period_end',
			{ retryable: false, context: { subscriptionId: subscription.id } }
		);
	}

	await container.userRepo.updatePlan(tenantId, user.id, 'pro', currentPeriodEnd * 1000, undefined, billingInterval);
	console.log(
		`[stripe-webhook] Updated user ${email} (tenant ${tenantId}) → plan: pro, interval: ${billingInterval}, expires: ${new Date(currentPeriodEnd * 1000).toISOString()}`
	);
}

// ---------------------------------------------------------------------------
// customer.subscription.deleted
// Fired when a subscription is fully cancelled (period ends or immediate cancel).
// Downgrades the user to free and clears any subscription flags.
//
// Missing metadata/user are NOT treated as alertable errors here — unlike the
// upgrade paths, the desired end state (user has no active pro access) is either
// already true or harmless to skip, so there is nothing for a human to fix.
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
	if (!subscriptionId) return; // not a subscription invoice — nothing to reconcile

	const subscription = await callStripeApi('subscriptions.retrieve', () =>
		stripe.subscriptions.retrieve(subscriptionId)
	);
	const { tenantId, email } = subscription.metadata ?? {};
	if (!tenantId || !email) {
		// Money was collected but we can't tell for whom — always worth a human look.
		throw new WebhookProcessingError(
			'MISSING_METADATA',
			`invoice.payment_succeeded subscription ${subscriptionId} has no tenantId/email metadata`,
			{ retryable: false, context: { subscriptionId } }
		);
	}

	// In Stripe v20, current_period_end is on SubscriptionItem, not Subscription
	const item = subscription.items.data[0];
	const priceId = item?.price?.id;
	const currentPeriodEnd = item?.current_period_end;
	const billingInterval = resolveProInterval(priceId, stripeConfig);

	if (!billingInterval) {
		throw new WebhookProcessingError(
			'PRICE_ID_MISMATCH',
			`priceId "${priceId}" does not match proPriceId or proAnnualPriceId configured for this tenant`,
			{
				retryable: false,
				context: {
					priceId,
					proPriceId: stripeConfig.proPriceId,
					proAnnualPriceId: stripeConfig.proAnnualPriceId,
					subscriptionId
				}
			}
		);
	}

	if (!currentPeriodEnd) {
		throw new WebhookProcessingError(
			'MISSING_SUBSCRIPTION_DATA',
			'Subscription item has no current_period_end',
			{ retryable: false, context: { subscriptionId } }
		);
	}

	await updateUserPlan(tenantId, email, 'pro', currentPeriodEnd * 1000, undefined, billingInterval);
}

// ---------------------------------------------------------------------------
// invoice.upcoming
// Fired ~3 days before a subscription renewal (configurable in Stripe dashboard).
// Sends a reminder email to the subscriber so they know the charge is coming.
// A failed reminder is not billing-critical — it's caught and logged, never
// retried or alerted on, so it can't trip up Stripe's retry budget for the event.
// ---------------------------------------------------------------------------
async function handleInvoiceUpcoming(
	stripe: Stripe,
	invoice: Stripe.Invoice,
	tenantRegistry: TenantRegistryData
) {
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

	let emailService: IEmailSenderService;
	let config: EmailSenderConfig;
	try {
		emailService = createEmailSenderService(tenantRegistry);
		config = {
			tenantId: tenantRegistry.tenantId,
			apiKey: tenantRegistry.resendApiKey ?? tenantRegistry.sesConfig?.accessKeyId ?? '',
			fromEmail: tenantRegistry.resendFromEmail ?? tenantRegistry.sesConfig?.fromEmail ?? ''
		};
	} catch {
		return; // no email service configured for this tenant — reminder silently skipped
	}
	const companyName = tenantRegistry.seoConfig?.siteName ?? tenantRegistry.companyName ?? 'LinkHub';

	await emailService
		.sendUpcomingRenewalEmail(config, { email, amountFormatted, renewalDate }, companyName)
		.then(() => console.log(`[stripe-webhook] invoice.upcoming — renewal reminder sent to ${email}`))
		.catch((err) =>
			console.error(`[stripe-webhook] Failed to send upcoming renewal email to ${email}:`, err)
		);
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
	stripeSubscriptionId: string | null | undefined,
	billingInterval: ProBillingInterval
) {
	const user = await container.userRepo.findByEmail(tenantId, email);
	if (!user) {
		throw new WebhookProcessingError(
			'USER_NOT_FOUND',
			`No user found for tenantId=${tenantId} email=${email}`,
			{ retryable: false, context: { tenantId, email } }
		);
	}

	await container.userRepo.updatePlan(tenantId, user.id, plan, planExpiredAt, stripeSubscriptionId, billingInterval);
	console.log(
		`[stripe-webhook] Updated user ${email} (tenant ${tenantId}) → plan: ${plan}, interval: ${billingInterval}, expires: ${new Date(planExpiredAt).toISOString()}`
	);
}

// ---------------------------------------------------------------------------
// Alert email — fired for every classified processing failure (retryable or
// not) so a human finds out immediately instead of via a support ticket days
// later. Uses the tenant's own configured email service, same as every other
// notification in this codebase (see sendSupportTicketNotification).
// ---------------------------------------------------------------------------
async function sendWebhookFailureAlert(
	tenantRegistry: TenantRegistryData,
	domain: string,
	event: Stripe.Event,
	failure: ClassifiedWebhookFailure
): Promise<void> {
	const alertEmailsRaw = process.env.NEXT_STRIPE_ALERT_EMAILS ?? '';
	const alertEmails = alertEmailsRaw.split(',').map((e) => e.trim()).filter(Boolean);
	if (alertEmails.length === 0) return;

	let emailService: IEmailSenderService;
	let emailConfig: EmailSenderConfig;
	try {
		emailService = createEmailSenderService(tenantRegistry);
		emailConfig = {
			tenantId: tenantRegistry.tenantId,
			apiKey: tenantRegistry.resendApiKey ?? tenantRegistry.sesConfig?.accessKeyId ?? '',
			fromEmail: tenantRegistry.resendFromEmail ?? tenantRegistry.sesConfig?.fromEmail ?? ''
		};
	} catch {
		return; // no email service configured for this tenant — nothing more we can do
	}

	const companyName = tenantRegistry.seoConfig?.siteName ?? tenantRegistry.companyName ?? 'LinkHub';

	await emailService.sendStripeWebhookErrorNotification(
		emailConfig,
		alertEmails,
		{
			eventId: event.id,
			eventType: event.type,
			domain,
			tenantId: tenantRegistry.tenantId,
			reason: failure.reason,
			retryable: failure.retryable,
			detail: failure.message
		},
		companyName
	);
}
