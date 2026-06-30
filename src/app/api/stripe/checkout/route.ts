import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkAuth } from '@/lib/auth/checkAuth';

export async function POST(req: NextRequest) {
	try {
		const { tenantId, email, tenantRegistry } = await checkAuth(req);
		const { stripeConfig, domain } = tenantRegistry;

		if (!stripeConfig) {
			return NextResponse.json(
				{ error: 'Stripe not configured for this tenant' },
				{ status: 400 }
			);
		}

		if (!domain) {
			return NextResponse.json(
				{ error: 'Domain not configured for this tenant' },
				{ status: 400 }
			);
		}

		let interval: 'month' | 'year' = 'month';
		try {
			const body = await req.json();
			if (body.interval === 'year' || body.interval === 'month') {
				interval = body.interval;
			}
		} catch {
			// no body or invalid JSON → default to monthly
		}

		let priceId = stripeConfig.proPriceId;
		if (interval === 'year') {
			if (!stripeConfig.proAnnualPriceId) {
				return NextResponse.json(
					{ error: 'El plan anual no está configurado para este tenant' },
					{ status: 400 }
				);
			}
			priceId = stripeConfig.proAnnualPriceId;
		}

		const stripe = new Stripe(stripeConfig.secretKey);

		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			allow_promotion_codes: true,
			line_items: [{ price: priceId, quantity: 1 }],
			customer_email: email ?? undefined,
			subscription_data: {
				trial_period_days: 90,
				metadata: { email: email ?? '', tenantId, domain, interval }
			},
			metadata: {
				email: email ?? '',
				tenantId,
				domain,
				interval
			},
			success_url: `https://${domain}/u/admin/dashboard?successStripe=true`,
			cancel_url: `https://${domain}/u/admin/dashboard?successStripe=false`
		});

		return NextResponse.json({ url: session.url }, { status: 201 });
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : 'Failed to create checkout session';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
