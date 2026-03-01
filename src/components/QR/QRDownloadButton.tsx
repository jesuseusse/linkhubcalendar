'use client';

import { useState } from 'react';
import QRCode from 'qrcode';
import { ThemeDto } from '@/dtos/user.dto';

export interface QRDownloadButtonProps {
	profileUrl: string;
	username: string;
	theme?: Partial<ThemeDto>;
}

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

const DEFAULT_THEME: ThemeDto = {
	backgroundColor: '#ffffff',
	textColor: '#18181b',
	buttonColor: '#18181b',
	buttonTextColor: '#ffffff',
	accentColor: '#a1a1aa'
};

export function QRDownloadButton({
	profileUrl,
	username,
	theme
}: QRDownloadButtonProps) {
	const { backgroundColor, textColor, accentColor } = {
		...DEFAULT_THEME,
		...theme
	};

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const urlObj = (() => {
		try {
			const u = new URL(profileUrl);
			return { domain: u.hostname, path: u.pathname };
		} catch {
			return { domain: profileUrl, path: '' };
		}
	})();

	async function handleDownload() {
		setError(null);
		setLoading(true);

		try {
			// 1. Generate QR as data URL
			const qrDataUrl = await QRCode.toDataURL(profileUrl, {
				width: 600,
				margin: 2,
				color: { dark: textColor, light: backgroundColor }
			});

			// 2. Set up canvas
			const canvas = document.createElement('canvas');
			canvas.width = CARD_WIDTH;
			canvas.height = CARD_HEIGHT;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Canvas not supported');

			// Background
			ctx.fillStyle = backgroundColor;
			ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

			// Accent bars (top & bottom)
			const barHeight = Math.round(CARD_HEIGHT * 0.008);
			ctx.fillStyle = accentColor;
			ctx.fillRect(0, 0, CARD_WIDTH, barHeight);
			ctx.fillRect(0, CARD_HEIGHT - barHeight, CARD_WIDTH, barHeight);

			// QR code image
			const qrSize = Math.round(CARD_WIDTH * 0.6);
			const qrX = (CARD_WIDTH - qrSize) / 2;
			const qrY = Math.round(CARD_HEIGHT / 2 - qrSize / 2 - CARD_WIDTH * 0.06);
			const qrImg = new Image();
			await new Promise<void>((resolve, reject) => {
				qrImg.onload = () => resolve();
				qrImg.onerror = reject;
				qrImg.src = qrDataUrl;
			});
			ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

			// URL text below QR
			const domainFontSize = Math.round(CARD_WIDTH * 0.038);
			const pathFontSize = Math.round(CARD_WIDTH * 0.046);
			const textBaseY =
				qrY + qrSize + Math.round(CARD_WIDTH * 0.07) + domainFontSize;

			ctx.fillStyle = textColor;
			ctx.textAlign = 'center';
			ctx.font = `400 ${domainFontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
			ctx.fillText(urlObj.domain, CARD_WIDTH / 2, textBaseY);

			if (urlObj.path && urlObj.path !== '/') {
				ctx.font = `700 ${pathFontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
				ctx.fillText(
					urlObj.path.replace(/^\//, ''),
					CARD_WIDTH / 2,
					textBaseY + pathFontSize + Math.round(CARD_WIDTH * 0.012)
				);
			}

			// 3. Export and download
			const blob = await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob(
					b =>
						b ? resolve(b) : reject(new Error('Failed to create image blob')),
					'image/png'
				);
			});

			const objectUrl = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.download = `qr-${username}.png`;
			link.href = objectUrl;
			link.click();
			URL.revokeObjectURL(objectUrl);
		} catch {
			setError('Error al generar el QR, intenta de nuevo');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<button
				type='button'
				onClick={handleDownload}
				disabled={loading}
				className='px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors rounded'
			>
				{loading ? (
					<span className='flex items-center gap-2'>
						<Spinner />
						Generando...
					</span>
				) : (
					'Descargar tu código QR en una imagen'
				)}
			</button>

			{error && <p className='mt-2 text-xs text-error'>{error}</p>}
		</div>
	);
}

function Spinner() {
	return (
		<svg
			width='14'
			height='14'
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
			style={{ animation: 'spin 1s linear infinite' }}
		>
			<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
			<path d='M21 12a9 9 0 1 1-6.219-8.56' />
		</svg>
	);
}
