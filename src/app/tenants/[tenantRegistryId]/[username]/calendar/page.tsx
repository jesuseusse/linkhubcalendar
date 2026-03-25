import { container } from '@/infrastructure/container';
import { PublicCalendarClient } from './PublicCalendarClient';
import { PublicCalendarDto } from '@/dtos/user.dto';
import { notFound } from 'next/navigation';
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

	let calendar: PublicCalendarDto | null = null;
	try {
		calendar = await container.getPublicCalendarUseCase.execute(
			tenantConfig.tenantId,
			username
		);
	} catch {
		return {};
	}
	if (!calendar) return {};

	const seo = tenantConfig.seoConfig;
	const siteName = seo?.siteName ?? tenantConfig.companyName ?? '';
	const title = siteName
		? `Agenda cita con ${calendar.name} | ${siteName}`
		: `Agenda cita con ${calendar.name}`;
	const description = `Reserva una cita con ${calendar.name}. Selecciona la fecha y hora que mejor se adapte a tu agenda.`;
	const baseUrl = tenantConfig.domain
		? `https://${tenantConfig.domain}`
		: '';
	const canonical = baseUrl
		? `${baseUrl}/${tenantRegistryId}/${username}/calendar`
		: undefined;
	const ogImage = calendar.profilePhoto ?? seo?.ogImage ?? null;

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
				? { images: [{ url: ogImage, alt: calendar.name }] }
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

export default async function PublicCalendarPage({
	params
}: {
	params: Promise<{ username: string; tenantRegistryId: string }>;
}) {
	const { username, tenantRegistryId } = await params;

	console.log('tenantRegistry:', tenantRegistryId);

	const tenantConfig =
		await container.tenantRegistryRepo.getByHostname(tenantRegistryId);

	if (!tenantConfig) {
		notFound();
	}

	const calendar = await container.getPublicCalendarUseCase.execute(
		tenantConfig.tenantId,
		username
	);

	return <PublicCalendarClient calendar={calendar} username={username} />;
}
