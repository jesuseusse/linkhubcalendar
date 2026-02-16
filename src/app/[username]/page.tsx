import { container } from '@/infrastructure/container';
import { PublicProfileClient } from './PublicProfileClient';
import { resolveTenantIdFromHeaders } from '@/lib/auth/resolveTenantId';

export default async function PublicProfilePage({
	params
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = await params;
	try {
		const tenantId = await resolveTenantIdFromHeaders();
		const profile = await container.getPublicProfileUseCase.execute(tenantId, username);
		return <PublicProfileClient profile={profile} />;
	} catch {
		return (
			<div className='min-h-screen bg-surface flex items-center justify-center'>
				<p className='text-sm text-muted-foreground'>Profile not found</p>
			</div>
		);
	} finally {
		return (
			<div className='min-h-screen bg-surface flex items-center justify-center'>
				<p className='text-sm text-muted-foreground'>Profile not found</p>
			</div>
		); // Ensure cleanup happens if needed
	}
}
