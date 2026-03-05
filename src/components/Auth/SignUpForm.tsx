'use client';

import { useState } from 'react';
import type { SignUpDto } from '@/dtos/auth.dto';

interface Props {
	onSubmit: (dto: SignUpDto) => Promise<void>;
	loading: boolean;
	error: string | null;
	onSwitchToLogin: () => void;
}

export function SignUpForm({
	onSubmit,
	loading,
	error,
	onSwitchToLogin
}: Props) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!acceptedPrivacy) return;
		const referredBy = localStorage.getItem('referral_code') ?? undefined;
		await onSubmit({ name, email, password, referredBy });
	};

	return (
		<form onSubmit={handleSubmit} className='space-y-4'>
			<h2 className='text-lg font-semibold text-foreground'>Registrarse</h2>
			{error && (
				<p className='text-sm text-error bg-error-light border border-error/20 px-3 py-2'>
					{error}
				</p>
			)}
			<div>
				<label className='block text-xs font-medium text-muted-foreground mb-1'>
					Nombre
				</label>
				<input
					type='text'
					value={name}
					onChange={e => setName(e.target.value)}
					required
					className='w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded'
				/>
			</div>
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
			<div>
				<label className='block text-xs font-medium text-muted-foreground mb-1'>
					Contraseña
				</label>
				<div className='relative'>
					<input
						type={showPassword ? 'text' : 'password'}
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
						className='w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded pr-10'
					/>
					<button
						type='button'
						onClick={() => setShowPassword(!showPassword)}
						className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground'
					>
						{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
					</button>
				</div>
			</div>
			<label className='flex items-center gap-2 text-xs text-muted-foreground'>
				<input
					type='checkbox'
					checked={acceptedPrivacy}
					onChange={e => setAcceptedPrivacy(e.target.checked)}
					className='accent-primary'
				/>
				Acepto la{' '}
				<a
					href='https://jesuseusse.com/privacy-policy'
					target='_blank'
					rel='noopener noreferrer'
					className='text-foreground font-medium hover:underline'
				>
					Política de Privacidad
				</a>
			</label>
			<button
				type='submit'
				disabled={loading || !acceptedPrivacy}
				className='w-full py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
			>
				{loading ? 'Registrando...' : 'Registrarse'}
			</button>
			<p className='text-xs text-muted-foreground text-center'>
				¿Ya tienes cuenta?{' '}
				<button
					type='button'
					onClick={onSwitchToLogin}
					className='text-foreground font-medium hover:underline'
				>
					Iniciar Sesión
				</button>
			</p>
		</form>
	);
}
