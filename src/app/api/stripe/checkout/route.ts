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

		const stripe = new Stripe(stripeConfig.secretKey);

		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			line_items: [{ price: stripeConfig.proPriceId, quantity: 1 }],
			customer_email: email ?? undefined,
			metadata: {
				email: email ?? '',
				tenantId,
				domain
			},
			success_url: `${req.nextUrl.origin}/u/admin/dashboard?successStripe=true`,
			cancel_url: `${req.nextUrl.origin}/u/admin/dashboard?successStripe=false`
		});

		return NextResponse.json({ url: session.url }, { status: 201 });
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : 'Failed to create checkout session';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
