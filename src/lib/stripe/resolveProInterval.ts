import { StripeConfig } from '@/interfaces/IStripeConfig';

export type ProBillingInterval = 'month' | 'year';

/**
 * Resolves which configured pro price (monthly or annual) a Stripe price ID belongs to.
 *
 * This is the single source of truth for month/year classification — every checkout
 * this app creates uses exactly `stripeConfig.proPriceId` or `stripeConfig.proAnnualPriceId`
 * (see /api/stripe/checkout), so a price ID that matches neither is always a config or
 * data problem, never a routine case to silently ignore.
 *
 * Deliberately does NOT fall back to `subscription.metadata.interval` — metadata is set
 * once at checkout creation and can drift from the actual Stripe price (e.g. if the
 * tenant's price IDs are reconfigured later), so the live price ID is the only value
 * trusted for billing decisions.
 */
export function resolveProInterval(
	priceId: string | undefined,
	stripeConfig: StripeConfig
): ProBillingInterval | null {
	if (!priceId) return null;
	if (priceId === stripeConfig.proPriceId) return 'month';
	if (stripeConfig.proAnnualPriceId && priceId === stripeConfig.proAnnualPriceId) return 'year';
	return null;
}
