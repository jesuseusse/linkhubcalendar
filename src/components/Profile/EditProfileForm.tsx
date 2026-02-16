'use client';

import { useState } from 'react';
import { UpdateProfileDto } from '@/dtos/user.dto';

interface Props {
	name: string;
	email: string;
	onSubmit: (dto: UpdateProfileDto) => Promise<void>;
	loading: boolean;
}

export function EditProfileForm({
	name: initialName,
	email: initialEmail,
	onSubmit,
	loading
}: Props) {
	const [name, setName] = useState(initialName);
	const [email, setEmail] = useState(initialEmail);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		try {
			await onSubmit({ name, email });
		} catch (err: unknown) {
			setError(
				err instanceof Error ? err.message : 'Error al actualizar el perfil'
			);
		}
	};

	return (
		<form onSubmit={handleSubmit} className='space-y-3'>
			{error && <p className='text-xs text-error'>{error}</p>}
			<div>
				<label className='block text-xs font-medium text-muted-foreground mb-1'>
					Nombre
				</label>
				<input
					type='text'
					value={name}
					onChange={e => setName(e.target.value)}
					className='w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded'
				/>
			</div>
			<div>
				<label className='block text-xs font-medium text-muted-foreground mb-1'>
					Correo electrónico
				</label>
				<input
					type='email'
					value={email}
					onChange={e => setEmail(e.target.value)}
					className='w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded'
				/>
			</div>
			<button
				type='submit'
				disabled={loading}
				className='px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors rounded'
			>
				{loading ? 'Actualizando...' : 'Actualizar'}
			</button>
		</form>
	);
}
