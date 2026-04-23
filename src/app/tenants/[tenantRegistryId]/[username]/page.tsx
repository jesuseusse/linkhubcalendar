import { container } from '@/infrastructure/container';
import { PublicProfileClient } from './PublicProfileClient';
import { PublicProfileDto } from '@/dtos/user.dto';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';

type PageParams = { username: string; tenantRegistryId: string };

export async function generateMetadata({
	params
}: {
	params: Promise<PageParams>;
}): Promise<Metadata> {
	const { username, tenantRegistryId } = await params;

	const tenantConfig =
		await container.tenantRegistryRepo.getByHostname(tenantRegistryId);
	if (!tenantConfig) return {};

	let profile: PublicProfileDto | null = null;
	try {
		profile = await container.getPublicProfileUseCase.execute(
			tenantConfig.tenantId,
			username
		);
	} catch {
		return {};
	}
	if (!profile) return {};

	const seo = tenantConfig.seoConfig;
	const siteName = seo?.siteName ?? tenantConfig.companyName ?? '';
	const title = siteName ? `${profile.name} | ${siteName}` : profile.name;
	const description = profile.description ?? seo?.description ?? '';
	const baseUrl = tenantConfig.domain
		? `https://${tenantConfig.domain}`
		: '';
	const canonical = baseUrl
		? `${baseUrl}/${tenantRegistryId}/${username}`
		: undefined;
	const ogImage =
		profile.profilePhoto ?? seo?.ogImage ?? null;

	return {
		title,
		description,
		...(seo?.keywords?.length ? { keywords: seo.keywords } : {}),
		...(canonical ? { alternates: { canonical } } : {}),
		openGraph: {
			type: 'profile',
			title,
			description,
			...(siteName ? { siteName } : {}),
			...(canonical ? { url: canonical } : {}),
			...(seo?.locale ? { locale: seo.locale } : {}),
			...(ogImage
				? { images: [{ url: ogImage, alt: profile.name }] }
				: {})
		},
		twitter: {
			card: 'summary',
			title,
			description,
			...(seo?.twitterHandle
				? { site: seo.twitterHandle, creator: seo.twitterHandle }
				: {}),
			...(ogImage ? { images: [ogImage] } : {})
		},
		robots: { index: true, follow: true }
	};
}

export default async function PublicProfilePage({
	params
}: {
	params: Promise<{ username: string; tenantRegistryId: string }>;
}) {
	const { username, tenantRegistryId } = await params;

	let profile: PublicProfileDto | null = null;

	const tenantConfig =
		await container.tenantRegistryRepo.getByHostname(tenantRegistryId);

	if (!tenantConfig) {
		notFound();
	}

	try {
		profile = await container.getPublicProfileUseCase.execute(
			tenantConfig.tenantId,
			username
		);
	} catch {
		redirect('/');
	}

	if (!profile) {
		redirect('/');
	}

	return (
		<PublicProfileClient
			profile={profile}
			logoUrl={tenantConfig.logoUrl ?? undefined}
			siteName={tenantConfig.seoConfig?.siteName ?? tenantConfig.companyName ?? undefined}
		/>
	);
}
