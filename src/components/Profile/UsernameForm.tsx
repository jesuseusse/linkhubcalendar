'use client';

import { useState, useMemo } from 'react';
import { PublicProfileLink } from './PublicProfileLink';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

interface Props {
	username?: string;
	usernameChangedAt?: number;
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
	const [now] = useState<number>(() => Date.now());

	const userNameLabel = username ? 'cambiar' : 'guardar';

	const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
	const { isLocked, daysLeft } = useMemo(() => {
		if (!usernameChangedAt) return { isLocked: false, daysLeft: 0 };
		const elapsed = now - usernameChangedAt;
		return {
			isLocked: elapsed < THIRTY_DAYS_MS,
			daysLeft: Math.ceil((THIRTY_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000))
		};
	}, [usernameChangedAt, THIRTY_DAYS_MS, now]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(false);
		try {
			await onSubmit(value);
			setSuccess(true);
		} catch (err: unknown) {
			setError(getFirebaseErrorMessage(err, 'Error al actualizar el usuario'));
		}
	};

	return (
		<div className='space-y-3'> 
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
			{isLocked && username && (
				<p className='text-xs text-warning'>
					Podrás cambiar tu usuario nuevamente en {daysLeft} día(s).
				</p>
			)}
			<form onSubmit={handleSubmit} className='flex gap-2'>
				<div className='w-full flex items-center border border-border'>
					<span className='px-2 text-sm text-muted-foreground'>/</span>
					<input
						type='text'
						value={value}
						onChange={e => setValue(e.target.value.toLowerCase())}
						placeholder='usuario'
						pattern='[a-z0-9_-]{3,30}'
						title='Solo letras minúsculas, números, guiones y guiones bajos (3-30 caracteres)'
						required
						disabled={isLocked}
						className='px-1 py-2 text-sm focus:outline-none'
					/>
				</div>
				<button
					type='submit'
					disabled={loading || isLocked}
					className='w-full px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors rounded'
				>
					{loading ? 'Guardando...' : userNameLabel}
				</button>
			</form>
		</div>
	);
}
