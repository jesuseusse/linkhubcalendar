import { container } from '@/infrastructure/container';
import { PublicProfileClient } from './PublicProfileClient';
import { resolveTenantIdFromHeaders } from '@/lib/auth/resolveTenantId';
import { PublicProfileDto } from '@/dtos/user.dto';

export default async function PublicProfilePage({
	params
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = await params;

	let profile: PublicProfileDto | null = null;
	try {
		const tenantId = await resolveTenantIdFromHeaders();
		profile = await container.getPublicProfileUseCase.execute(
			tenantId,
			username
		);
	} catch {
		// Profile fetch failed — handled below
	}

	if (!profile) {
		return (
			<div className='min-h-screen bg-surface flex items-center justify-center'>
				<p className='text-sm text-muted-foreground'>Profile not found</p>
			</div>
		);
	}

	return <PublicProfileClient profile={profile} />;
}
