export interface SeoConfig {
	siteName: string;
	title: string;
	description: string;
	keywords: string[];
	ogImage: string | null;
	favicon: string | null;
	canonicalUrl: string | null;
	locale: string;
	twitterHandle: string | null;
	organizationType: string;
}
