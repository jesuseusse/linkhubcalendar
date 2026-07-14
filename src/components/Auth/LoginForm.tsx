'use client';

import { useState } from 'react';
import type { LoginDto } from '@/dtos/auth.dto';

interface Props {
	onSubmit: (dto: LoginDto) => Promise<void>;
	loading: boolean;
	error: string | null;
	onSwitchToSignUp: () => void;
	onForgotPassword?: () => void;
}

export function LoginForm({
	onSubmit,
	loading,
	error,
	onSwitchToSignUp,
	onForgotPassword,
}: Props) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onSubmit({ email, password });
	};

	return (
		<form onSubmit={handleSubmit} className='space-y-4'>
			<h2 className='text-lg font-semibold text-foreground'>Iniciar Sesión</h2>
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
			{onForgotPassword && (
				<button
					type='button'
					onClick={onForgotPassword}
					className='text-xs text-muted-foreground hover:text-foreground transition-colors self-start -mt-1'
				>
					¿Olvidaste tu contraseña?
				</button>
			)}
			<button
				type='submit'
				disabled={loading}
				className='w-full py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
			>
				{loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
			</button>
			<p className='text-xs text-muted-foreground text-center'>
				¿No tienes cuenta?{' '}
				<button
					type='button'
					onClick={onSwitchToSignUp}
					className='text-foreground font-medium hover:underline'
				>
					Registrarse
				</button>
			</p>
		</form>
	);
}
