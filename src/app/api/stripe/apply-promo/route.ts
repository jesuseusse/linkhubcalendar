import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkAuth } from '@/lib/auth/checkAuth';
import { container } from '@/infrastructure/container';

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_INVALID_PER_DAY = 3;

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

		// Monthly valid-apply limit: 1 per 30 days
		if (user.promoLastAppliedAt && Date.now() - user.promoLastAppliedAt < ONE_MONTH_MS) {
			return NextResponse.json(
				{ error: 'Ya aplicaste un código este mes. Puedes aplicar uno nuevo el próximo mes.' },
				{ status: 429 }
			);
		}

		// Daily invalid-attempt limit: 3 per day
		const today = new Date().toISOString().slice(0, 10);
		const todayAttempts =
			user.promoInvalidAttemptsDate === today ? (user.promoInvalidAttempts ?? 0) : 0;
		if (todayAttempts >= MAX_INVALID_PER_DAY) {
			return NextResponse.json(
				{ error: 'Demasiados intentos fallidos hoy. Vuelve mañana.' },
				{ status: 429 }
			);
		}

		const stripe = new Stripe(stripeConfig.secretKey);

		const promoCodes = await stripe.promotionCodes.list({
			code,
			active: true,
			limit: 1,
			expand: ['data.promotion.coupon']
		});

		if (promoCodes.data.length === 0) {
			await container.userRepo.updatePromoRateLimit(tenantId, userId, {
				promoInvalidAttempts: todayAttempts + 1,
				promoInvalidAttemptsDate: today
			});
			return NextResponse.json(
				{ error: 'El código de promoción no es válido o ha expirado' },
				{ status: 400 }
			);
		}

		const promoCode = promoCodes.data[0];

		await stripe.subscriptions.update(user.stripeSubscriptionId, {
			discounts: [{ promotion_code: promoCode.id }]
		});

		await container.userRepo.updatePromoRateLimit(tenantId, userId, {
			promoLastAppliedAt: Date.now(),
			promoInvalidAttempts: 0,
			promoInvalidAttemptsDate: today
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
