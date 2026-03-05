import { container } from '@/infrastructure/container';
import { PublicProfileClient } from './PublicProfileClient';
import { PublicProfileDto } from '@/dtos/user.dto';
import { notFound, redirect } from 'next/navigation';

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

	return <PublicProfileClient profile={profile} />;
}
