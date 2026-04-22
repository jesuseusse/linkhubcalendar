// app/_tenants/[tenantId]/layout.tsx
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { tenantThemeToCssVars } from '@/lib/tenant/tenantTheme';
import { container } from '@/infrastructure/container';
import ReferralCapture from '@/components/Common/ReferralCapture';

export async function generateMetadata({
	params
}: {
	params: Promise<{ tenantRegistryId: string }>;
}): Promise<Metadata> {
	const { tenantRegistryId } = await params;
	const tenantConfig =
		await container.tenantRegistryRepo.getByHostname(tenantRegistryId);

	if (!tenantConfig) return {};

	const seo = tenantConfig.seoConfig;
	const siteName = seo?.siteName ?? tenantConfig.companyName ?? undefined;
	const title = seo?.title ?? tenantConfig.companyName ?? undefined;
	const description = seo?.description ?? undefined;
	const canonicalUrl =
		(seo?.canonicalUrl ?? tenantConfig.domain)
			? `https://${seo?.canonicalUrl ?? tenantConfig.domain}`
			: undefined;

	const faviconUrl = seo?.favicon ?? tenantConfig.logoUrl ?? undefined;

	console.log(tenantConfig.logoUrl);

	return {
		title,
		description,
		keywords: seo?.keywords,
		metadataBase: canonicalUrl ? new URL(canonicalUrl) : undefined,
		alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
		icons: faviconUrl ? { icon: faviconUrl, shortcut: faviconUrl } : undefined,
		openGraph: {
			siteName,
			title: title ?? undefined,
			description: description ?? undefined,
			locale: seo?.locale ?? 'es_ES',
			type: 'website',
			url: canonicalUrl ?? undefined,
			images: seo?.ogImage
				? [{ url: seo.ogImage }]
				: tenantConfig.logoUrl
					? [{ url: tenantConfig.logoUrl }]
					: undefined
		},
		twitter: {
			card: 'summary_large_image',
			title: title ?? undefined,
			description: description ?? undefined,
			site: seo?.twitterHandle ?? undefined,
			images: seo?.ogImage
				? [seo.ogImage]
				: tenantConfig.logoUrl
					? [tenantConfig.logoUrl]
					: undefined
		}
	};
}

function buildGoogleFontsUrl(fonts: string[]): string {
	const families = fonts
		.map(f => `family=${f.replace(/ /g, '+')}:wght@400;600;700;900`)
		.join('&');
	return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export default async function TenantLayout({
	children,
	params
}: {
	children: React.ReactNode;
	params: Promise<{ tenantRegistryId: string }>;
}) {
	const { tenantRegistryId } = await params;

	// 1. Resolem el tenantId dels params de la URL (gràcies al rewrite del middleware)
	const tenantConfig =
		await container.tenantRegistryRepo.getByHostname(tenantRegistryId);

	if (!tenantConfig) {
		notFound(); // Tenant config no found, render 404
	}

	let themeStyle: Record<string, string> = {};
	let customFonts: string[] = [];

	if (tenantConfig.theme) {
		// 2. Transformem el tema de Firebase a CSS Variables
		themeStyle = tenantThemeToCssVars(tenantConfig.theme);

		// Collect custom fonts that differ from the global Inter default
		const { fontHeading, fontBody } = tenantConfig.theme;
		const candidates = [fontHeading, fontBody].filter(
			(f): f is string => !!f && f !== 'Inter'
		);
		customFonts = [...new Set(candidates)];
	}

	const seo = tenantConfig.seoConfig;
	const jsonLd = seo
		? {
				'@context': 'https://schema.org',
				'@type': seo.organizationType || 'Organization',
				name: seo.siteName || tenantConfig.companyName || undefined,
				url: seo.canonicalUrl
					? `https://${seo.canonicalUrl}`
					: tenantConfig.domain
						? `https://${tenantConfig.domain}`
						: undefined,
				description: seo.description || undefined,
				logo: seo.ogImage || seo.favicon || tenantConfig.logoUrl || undefined,
				...(seo.twitterHandle
					? {
							sameAs: [
								`https://twitter.com/${seo.twitterHandle.replace(/^@/, '')}`
							]
						}
					: {})
			}
		: null;

	return (
		<section style={themeStyle}>
			{customFonts.length > 0 && (
				<>
					<link rel='preconnect' href='https://fonts.googleapis.com' />
					<link
						rel='preconnect'
						href='https://fonts.gstatic.com'
						crossOrigin='anonymous'
					/>
					<link
						rel='stylesheet'
						href={buildGoogleFontsUrl(customFonts)}
					/>
				</>
			)}
			{jsonLd && (
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			)}
			<Suspense fallback={null}>
				<ReferralCapture />
			</Suspense>
			{children}
		</section>
	);
}
