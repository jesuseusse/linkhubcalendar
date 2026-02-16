'use client';

import { useState } from 'react';
import { PublicProfileLink } from './PublicProfileLink';

interface Props {
	username?: string;
	usernameChangedAt?: string;
	onSubmit: (username: string) => Promise<void>;
	loading: boolean;
}

export function UsernameForm({
	username,
	usernameChangedAt,
	onSubmit,
	loading
}: Props) {
	const [value, setValue] = useState(username || '');
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
	const isLocked = usernameChangedAt
		? new Date().getTime() - new Date(usernameChangedAt).getTime() <
			THIRTY_DAYS_MS
		: false;
	const daysLeft = usernameChangedAt
		? Math.ceil(
				(THIRTY_DAYS_MS -
					(new Date().getTime() - new Date(usernameChangedAt).getTime())) /
					(24 * 60 * 60 * 1000)
			)
		: 0;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(false);
		try {
			await onSubmit(value);
			setSuccess(true);
		} catch (err: unknown) {
			setError(
				err instanceof Error ? err.message : 'Error al actualizar el usuario'
			);
		}
	};

	return (
		<div className='space-y-3'>
			<h3 className='text-sm font-semibold text-foreground'>
				Nombre de usuario
			</h3>
			{username && <PublicProfileLink username={username} />}
			{!username && (
				<p className='text-xs text-muted-foreground'>
					Configura tu nombre de usuario para crear tu perfil público.
				</p>
			)}
			{error && <p className='text-xs text-error'>{error}</p>}
			{success && (
				<p className='text-xs text-success'>
					Nombre de usuario actualizado correctamente.
				</p>
			)}
			{isLocked && username ? (
				<p className='text-xs text-warning'>
					Podrás cambiar tu usuario nuevamente en ${daysLeft} día(s).
				</p>
			) : (
				<form onSubmit={handleSubmit} className='flex gap-2'>
					<div className='flex items-center border border-border'>
						<span className='px-2 text-sm text-muted-foreground'>/</span>
						<input
							type='text'
							value={value}
							onChange={e => setValue(e.target.value)}
							placeholder='usuario'
							pattern='[a-zA-Z0-9_-]{3,30}'
							title='Solo letras, números, guiones y guiones bajos (3-30 caracteres)'
							required
							className='px-1 py-2 text-sm focus:outline-none'
						/>
					</div>
					<button
						type='submit'
						disabled={loading}
						className='px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors rounded'
					>
						{loading ? 'Guardando...' : username ? 'Cambiar' : 'Establecer'}
					</button>
				</form>
			)}
		</div>
	);
}
