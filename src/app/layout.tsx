import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { resolveTenantRegistryFromHeaders } from '@/lib/auth/resolveTenantId';
import { tenantThemeToCssVars } from '@/lib/tenant/tenantTheme';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'LinkHub',
	description: 'Your links, your way'
};

export default async function RootLayout({
	children
}: {
	children: React.ReactNode;
}) {
	let themeStyle: Record<string, string> = {};

	try {
		const { theme } = await resolveTenantRegistryFromHeaders();
		if (theme) {
			themeStyle = tenantThemeToCssVars(theme);
		}
	} catch {
		// Tenant resolution failed — @theme defaults apply
	}

	console.log(themeStyle);

	return (
		<html lang='en' style={themeStyle}>
			<head>
				<link
					href='https://fonts.googleapis.com/icon?family=Material+Icons'
					rel='stylesheet'
				/>
			</head>
			<body className={inter.className}>{children}</body>
		</html>
	);
}
