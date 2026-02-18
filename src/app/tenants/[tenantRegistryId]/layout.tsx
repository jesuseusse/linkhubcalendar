// app/_tenants/[tenantId]/layout.tsx
import { notFound } from 'next/navigation';
import { tenantThemeToCssVars } from '@/lib/tenant/tenantTheme';
import { container } from '@/infrastructure/container';

export default async function TenantLayout({
	children,
	params
}: {
	children: React.ReactNode;
	params: Promise<{ tenantRegistryId: string }>;
}) {
	const { tenantRegistryId } = await params;

	console.log(`tenants/${tenantRegistryId}/layout`);

	// 1. Resolem el tenantId dels params de la URL (gràcies al rewrite del middleware)
	const tenantConfig =
		await container.tenantRegistryRepo.getByHostname(tenantRegistryId);

	if (!tenantConfig) {
		notFound(); // Tenant config no found, render 404
	}

	let themeStyle: Record<string, string> = {};

	if (tenantConfig.theme) {
		// 2. Transformem el tema de Firebase a CSS Variables
		themeStyle = tenantThemeToCssVars(tenantConfig.theme);
	}

	return (
		<section style={themeStyle}>
			{/* Aquí podries posar un Navbar específic del tenant */}
			{children}
		</section>
	);
}
