'use client';

import { useState } from 'react';

interface Props {
	onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: Props) {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			await fetch('/api/auth/password-reset', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});
			setSent(true);
		} catch {
			setError('Ocurrió un error. Intenta de nuevo más tarde.');
		} finally {
			setLoading(false);
		}
	};

	if (sent) {
		return (
			<div className='space-y-4'>
				<h2 className='text-lg font-semibold text-foreground'>Revisa tu correo</h2>
				<p className='text-sm text-muted-foreground'>
					Si tu correo está registrado, recibirás un enlace en breve. Revisa tu
					bandeja de entrada y spam.
				</p>
				<button
					type='button'
					onClick={onBack}
					className='text-xs text-muted-foreground hover:text-foreground transition-colors'
				>
					← Volver al inicio de sesión
				</button>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-4'>
			<h2 className='text-lg font-semibold text-foreground'>
				Recuperar contraseña
			</h2>
			<p className='text-sm text-muted-foreground'>
				Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
			</p>
			{error && (
				<p className='text-sm text-error bg-error-light border border-error/20 px-3 py-2'>
					{error}
				</p>
			)}
			<div>
				<label className='block text-xs font-medium text-muted-foreground mb-1'>
					Correo Electrónico
				</label>
				<input
					type='email'
					value={email}
					onChange={e => setEmail(e.target.value)}
					required
					className='w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded'
				/>
			</div>
			<button
				type='submit'
				disabled={loading}
				className='w-full py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
			>
				{loading ? 'Enviando...' : 'Enviar enlace'}
			</button>
			<button
				type='button'
				onClick={onBack}
				className='text-xs text-muted-foreground hover:text-foreground transition-colors'
			>
				← Volver al inicio de sesión
			</button>
		</form>
	);
}
