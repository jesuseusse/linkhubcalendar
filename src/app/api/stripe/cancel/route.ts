import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkAuth } from '@/lib/auth/checkAuth';
import { container } from '@/infrastructure/container';

export async function POST(req: NextRequest) {
	try {
		const { userId, tenantId, tenantRegistry } = await checkAuth(req);
		const { stripeConfig } = tenantRegistry;

		if (!stripeConfig) {
			return NextResponse.json(
				{ error: 'Stripe not configured for this tenant' },
				{ status: 400 }
			);
		}

		const user = await container.userRepo.findById(tenantId, userId);
		if (!user) {
			return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
		}

		if (!user.stripeSubscriptionId) {
			return NextResponse.json(
				{ error: 'No se encontró una suscripción activa' },
				{ status: 400 }
			);
		}

		if (user.plan === 'free') {
			return NextResponse.json(
				{ error: 'No tienes una suscripción activa para cancelar' },
				{ status: 400 }
			);
		}

		if (user.subscriptionCancelAtPeriodEnd) {
			return NextResponse.json(
				{ error: 'Tu suscripción ya está programada para cancelarse' },
				{ status: 400 }
			);
		}

		const stripe = new Stripe(stripeConfig.secretKey);

		await stripe.subscriptions.update(user.stripeSubscriptionId, {
			cancel_at_period_end: true
		});

		await container.userRepo.updateSubscriptionFlags(tenantId, userId, {
			subscriptionCancelAtPeriodEnd: true
		});

		return NextResponse.json({ success: true });
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : 'Error al cancelar la suscripción';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
