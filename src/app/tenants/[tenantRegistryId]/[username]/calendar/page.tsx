import { container } from '@/infrastructure/container';
import { PublicCalendarClient } from './PublicCalendarClient';
import { notFound } from 'next/navigation';

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
