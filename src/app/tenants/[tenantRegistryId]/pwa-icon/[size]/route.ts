import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { container } from '@/infrastructure/container';
import {
	PWA_DEFAULT_BACKGROUND_COLOR,
	PWA_DEFAULT_THEME_COLOR,
	isPwaIconSize
} from '@/lib/tenant/pwaManifest';

// sharp is a native module: it needs the Node.js runtime.
export const runtime = 'nodejs';

const LOGO_FETCH_TIMEOUT_MS = 5000;

/** Share of the icon the logo may occupy. Maskable icons need a bigger safe zone (OS crops to a circle/squircle). */
const LOGO_SCALE_ANY = 0.8;
const LOGO_SCALE_MASKABLE = 0.62;

async function fetchLogo(url: string): Promise<Buffer | null> {
	if (!url.startsWith('https://')) return null;
	try {
		const res = await fetch(url, {
			signal: AbortSignal.timeout(LOGO_FETCH_TIMEOUT_MS)
		});
		if (!res.ok) return null;
		return Buffer.from(await res.arrayBuffer());
	} catch {
		return null;
	}
}

/**
 * Square PNG app icon derived from the tenant logo, centered over the
 * tenant background color. Without a usable logo it falls back to a solid
 * primary-color square so the app stays installable.
 *
 * GET /pwa-icon/{180|192|512}[?maskable=1]
 */
export async function GET(
	req: Request,
	{ params }: { params: Promise<{ tenantRegistryId: string; size: string }> }
) {
	const { tenantRegistryId, size: sizeParam } = await params;
	const size = Number(sizeParam);
	if (!isPwaIconSize(size)) {
		return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
	}

	const tenant =
		await container.tenantRegistryRepo.getByHostname(tenantRegistryId);
	if (!tenant) {
		return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
	}

	const maskable = new URL(req.url).searchParams.get('maskable') === '1';
	const primary = tenant.theme?.primary ?? PWA_DEFAULT_THEME_COLOR;
	const background = tenant.theme?.background ?? PWA_DEFAULT_BACKGROUND_COLOR;

	const logo = tenant.logoUrl ? await fetchLogo(tenant.logoUrl) : null;

	let png: Buffer | null = null;
	if (logo) {
		try {
			const logoSize = Math.round(
				size * (maskable ? LOGO_SCALE_MASKABLE : LOGO_SCALE_ANY)
			);
			const resizedLogo = await sharp(logo)
				.resize(logoSize, logoSize, {
					fit: 'contain',
					background: { r: 0, g: 0, b: 0, alpha: 0 }
				})
				.png()
				.toBuffer();

			png = await sharp({
				create: { width: size, height: size, channels: 4, background }
			})
				.composite([{ input: resizedLogo, gravity: 'center' }])
				.png()
				.toBuffer();
		} catch {
			// Unreadable image or an invalid theme color: use the solid fallback below.
			png = null;
		}
	}

	if (!png) {
		try {
			png = await sharp({
				create: { width: size, height: size, channels: 4, background: primary }
			})
				.png()
				.toBuffer();
		} catch {
			png = await sharp({
				create: {
					width: size,
					height: size,
					channels: 4,
					background: PWA_DEFAULT_THEME_COLOR
				}
			})
				.png()
				.toBuffer();
		}
	}

	return new NextResponse(new Uint8Array(png), {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
		}
	});
}
