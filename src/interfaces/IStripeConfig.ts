export interface StripeConfig {
	proPriceId: string;
	proAnnualPriceId?: string;
	secretKey: string;
	publishableKey: string;
	webhookSecret: string;
	customerPortalLink?: string;
}
