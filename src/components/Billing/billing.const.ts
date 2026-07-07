// ─── Pricing ────────────────────────────────────────────────────────────────

export const BILLING_PRICES = {
	monthly: {
		promo: 75,
		regular: 200,
		currency: 'MXN',
		period: 'mes',
	},
	annual: {
		promo: 500,
		regular: 750,
		currency: 'MXN',
		period: 'año',
		monthlyEquiv: Math.floor(500 / 12), // ~41
	},
} as const;

// ─── UI Labels ───────────────────────────────────────────────────────────────

export const BILLING_LABELS = {
	// Badges
	trialBadge: '3 MESES GRATIS',
	promoBadge: 'PRECIO ESPECIAL',
	limitedOffer: 'OFERTA LIMITADA',
	planBadge: 'PRO',

	// Modal header
	modalTitle: 'Activa tu plan Pro',
	trialSubtext: 'Sin cobro durante los primeros 3 meses',

	// Toggle
	monthlyTab: 'Mensual',
	annualTab: 'Anual',
	annualTabBadge: 'MÁS AHORRO',

	// Pricing hints
	monthlyHint: `o paga anual a $${BILLING_PRICES.annual.promo}/año y ahorra más`,
	annualHint: `equivale a $${BILLING_PRICES.annual.monthlyEquiv}/mes`,

	// CTA
	ctaButton: 'Comenzar 3 meses gratis',
	ctaLoading: 'Redirigiendo...',
	disclaimer: 'Sin cobro durante los primeros 3 meses · Cancela cuando quieras',

	// ProBanner
	bannerHeadline: '¡3 meses GRATIS para ti!',
	bannerSubtext: `Precio promo: $${BILLING_PRICES.monthly.promo}/mes o $${BILLING_PRICES.annual.promo}/año · Oferta por tiempo limitado`,
	bannerCta: 'Reclamar plan gratis',
	bannerDetails: 'Ver detalles',

	// BillingClient plan labels
	billingMonthlyLabel: `Plan Mensual · $${BILLING_PRICES.monthly.promo} MXN/mes`,
	billingAnnualLabel: `Plan Anual · $${BILLING_PRICES.annual.promo} MXN/año`,
	billingFreeLabel: 'Plan gratuito',

	// Cancel subscription modal
	cancelModal: {
		title: 'Cancelar suscripción',
		subtitle: 'Tu plan permanecerá activo hasta el fin del periodo actual.',
		stepsHeading: 'Cómo cancelar:',
		steps: [
			'Haz click en el botón "Ir al portal de facturación" aquí abajo.',
			'Revisa tu correo electrónico y abre el enlace que recibirás.',
			'Selecciona la tarjeta con la que tienes activa tu suscripción.',
			'Haz click en "Cancelar suscripción".',
		] as readonly string[],
		portalCta: 'Ir al portal de facturación',
		keepCta: 'Mantener mi suscripción',
		cancelButton: 'Cancelar suscripción',
		portalNote: 'Se abrirá el portal de facturación en una nueva pestaña.',
		portalLoading: 'Cargando portal...',
	},
} as const;

// ─── Benefits list ───────────────────────────────────────────────────────────

export const BILLING_BENEFITS = [
	'Tema personalizado para tu perfil',
	'Formulario de contacto para clientes',
	'Calendario de citas online',
	'Galería de fotos profesional',
	'Captura y gestión de leads',
] as const;
