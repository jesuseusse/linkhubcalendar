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
				{ error: 'Stripe no está configurado para este tenant' },
				{ status: 400 }
			);
		}

		const body = await req.json();
		const code: string = (body.code ?? '').trim().toUpperCase();
		if (!code) {
			return NextResponse.json(
				{ error: 'El código de promoción es requerido' },
				{ status: 400 }
			);
		}

		const user = await container.userRepo.findById(tenantId, userId);
		if (!user) {
			return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
		}

		if (user.plan === 'free' || !user.stripeSubscriptionId) {
			return NextResponse.json(
				{ error: 'No tienes una suscripción activa' },
				{ status: 400 }
			);
		}

		if (user.subscriptionCancelAtPeriodEnd) {
			return NextResponse.json(
				{
					error: 'No se puede aplicar un código a una suscripción programada para cancelarse'
				},
				{ status: 400 }
			);
		}

		const stripe = new Stripe(stripeConfig.secretKey);

		const promoCodes = await stripe.promotionCodes.list({ code, active: true, limit: 1 });
		if (promoCodes.data.length === 0) {
			return NextResponse.json(
				{ error: 'El código de promoción no es válido o ha expirado' },
				{ status: 400 }
			);
		}

		const promoCode = promoCodes.data[0];

		await stripe.subscriptions.update(user.stripeSubscriptionId, {
			discounts: [{ promotion_code: promoCode.id }]
		});

		const couponData = promoCode.promotion.coupon;
		const coupon =
			couponData && typeof couponData === 'object' ? (couponData as Stripe.Coupon) : null;

		return NextResponse.json({
			success: true,
			discount: coupon
				? {
						percentOff: coupon.percent_off ?? null,
						amountOff: coupon.amount_off ?? null,
						currency: coupon.currency ?? null,
						duration: coupon.duration,
						durationInMonths: coupon.duration_in_months ?? null
					}
				: null
		});
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : 'Error al aplicar el código de promoción';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
