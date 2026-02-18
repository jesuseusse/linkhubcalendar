import { LANDING_COMPONENTS } from '@/lib/tenant/resolveTenantLandingPage';
import { notFound } from 'next/navigation';
import { container } from '@/infrastructure/container';

export default async function TenantPage({
	params
}: {
	params: Promise<{ tenantRegistryId: string }>;
}) {
	const { tenantRegistryId } = await params;

	// 1. Buscamos si existe un componente específico "hardcoded"
	// Si no existe, usamos el 'default'
	const SelectedLanding =
		LANDING_COMPONENTS[tenantRegistryId] || LANDING_COMPONENTS['default'];

	// 2. Traemos la config de Firebase (solo para el Theme/SEO)
	const tenantConfig =
		await container.tenantRegistryRepo.getByHostname(tenantRegistryId);

	if (!tenantConfig) notFound();

	return (
		// English: Render the specific hardcoded landing
		<SelectedLanding />
	);
}
