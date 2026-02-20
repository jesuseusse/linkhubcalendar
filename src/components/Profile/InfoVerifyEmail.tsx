'use client';

import { useState, useEffect, useCallback } from 'react';

const COOLDOWN_SECONDS = 120;

interface InfoVerifyEmailProps {
	onSendEmail: () => Promise<void>;
	loading: boolean;
}

export const InfoVerifyEmail = ({
	onSendEmail,
	loading
}: InfoVerifyEmailProps) => {
	const [countdown, setCountdown] = useState(0);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);

	useEffect(() => {
		if (countdown <= 0) return;
		const timer = setInterval(() => {
			setCountdown(prev => {
				if (prev <= 1) {
					clearInterval(timer);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [countdown]);

	const handleSend = useCallback(async () => {
		setSending(true);
		setError(null);
		try {
			await onSendEmail();
			setSent(true);
			setCountdown(COOLDOWN_SECONDS);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Error al enviar';
			setError(message);
			const match = message.match(/(\d+) segundos/);
			if (match) {
				setCountdown(parseInt(match[1], 10));
			}
		} finally {
			setSending(false);
		}
	}, [onSendEmail]);

	const isDisabled = loading || sending || countdown > 0;

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	};

	return (
		<section className='p-4 bg-surface border border-warning/30 rounded flex items-start gap-4'>
			<span className='text-warning text-2xl leading-none shrink-0'>
				&#9888;
			</span>
			<div className='flex-1 min-w-0'>
				<h3 className='text-sm font-semibold text-foreground'>
					Correo no verificado
				</h3>
				<p className='text-sm text-muted-foreground mt-1'>
					Revisa tu bandeja de entrada y confirma tu correo electrónico para
					acceder a todas las funciones de tu cuenta.
				</p>
				{sent && countdown > 0 && (
					<p className='text-sm text-muted-foreground mt-2'>
						Correo enviado. Puedes reenviar en {formatTime(countdown)}.
					</p>
				)}
				{error && !countdown && (
					<p className='text-sm text-error mt-2'>{error}</p>
				)}
				<button
					type='button'
					onClick={handleSend}
					disabled={isDisabled}
					className='mt-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded disabled:cursor-not-allowed transition-colors'
				>
					{sending
						? 'Enviando...'
						: countdown > 0
							? `Reenviar en ${formatTime(countdown)}`
							: 'Reenviar correo de verificación'}
				</button>
				{countdown > 0 && (
					<button
						type='button'
						onClick={() => window.location.reload()}
						className='ml-2 mt-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded disabled:cursor-not-allowed transition-colors'
					>
						Ya verifiqué mi correo
					</button>
				)}
			</div>
		</section>
	);
};
