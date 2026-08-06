import Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Typed failure classification for Stripe webhook processing.
//
// Two independent axes matter for every failure:
//   1. `reason`    — what went wrong, for logs/alert emails.
//   2. `retryable` — whether re-delivering the same event could plausibly
//                    succeed. Drives the HTTP status returned to Stripe:
//                    retryable → 5xx (let Stripe retry), non-retryable → 200
//                    (acknowledge so Stripe stops retrying; a human has to
//                    act, and retries would just waste 3 days doing nothing).
// ---------------------------------------------------------------------------

export type WebhookFailureReason =
	| 'MISSING_METADATA' // session/subscription is missing tenantId/email — should never happen, we set it ourselves
	| 'PRICE_ID_MISMATCH' // subscription price isn't either configured pro price — config drift
	| 'USER_NOT_FOUND' // metadata pointed at a user that no longer exists
	| 'MISSING_SUBSCRIPTION_DATA' // subscription retrieved but missing item/current_period_end
	| 'STRIPE_API_ERROR' // a call to the Stripe API failed
	| 'UNEXPECTED_ERROR'; // anything uncaught — treated as retryable by default

export interface WebhookFailureOptions {
	retryable: boolean;
	context?: Record<string, unknown>;
}

export class WebhookProcessingError extends Error {
	readonly reason: WebhookFailureReason;
	readonly retryable: boolean;
	readonly context: Record<string, unknown>;

	constructor(reason: WebhookFailureReason, message: string, options: WebhookFailureOptions) {
		super(message);
		this.name = 'WebhookProcessingError';
		this.reason = reason;
		this.retryable = options.retryable;
		this.context = options.context ?? {};
	}
}

export interface ClassifiedWebhookFailure {
	reason: WebhookFailureReason;
	message: string;
	retryable: boolean;
	context: Record<string, unknown>;
}

/**
 * Normalizes any thrown value into a ClassifiedWebhookFailure.
 * Unknown errors default to retryable — we can't rule out transience, so we
 * let Stripe retry while alerting a human in parallel.
 */
export function classifyWebhookFailure(err: unknown): ClassifiedWebhookFailure {
	if (err instanceof WebhookProcessingError) {
		return { reason: err.reason, message: err.message, retryable: err.retryable, context: err.context };
	}
	const message = err instanceof Error ? err.message : 'Unknown error';
	return { reason: 'UNEXPECTED_ERROR', message, retryable: true, context: {} };
}

/**
 * Wraps a Stripe API call, rethrowing failures as a classified WebhookProcessingError.
 * `resource_missing` (e.g. the subscription genuinely doesn't exist) is treated as
 * non-retryable — re-fetching the same ID will never succeed. Everything else
 * (network errors, Stripe 5xx, rate limits) is treated as transient/retryable.
 */
export async function callStripeApi<T>(operation: string, fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (err) {
		const isPermanentlyMissing =
			err instanceof Stripe.errors.StripeInvalidRequestError && err.code === 'resource_missing';

		throw new WebhookProcessingError(
			'STRIPE_API_ERROR',
			`Stripe API call failed (${operation}): ${err instanceof Error ? err.message : 'Unknown error'}`,
			{ retryable: !isPermanentlyMissing, context: { operation } }
		);
	}
}
