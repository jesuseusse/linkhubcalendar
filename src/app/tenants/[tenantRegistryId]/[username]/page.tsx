import { container } from '@/infrastructure/container';
import { PublicProfileClient } from './PublicProfileClient';
import { PublicProfileDto } from '@/dtos/user.dto';
import { notFound } from 'next/navigation';

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

	profile = await container.getPublicProfileUseCase.execute(
		tenantConfig.tenantId,
		username
	);

	if (!profile) {
		return (
			<div className='min-h-screen bg-surface flex items-center justify-center'>
				<p className='text-sm text-muted-foreground'>Profile not found</p>
			</div>
		);
	}

	return <PublicProfileClient profile={profile} />;
}
