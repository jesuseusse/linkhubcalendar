'use client';

import { useState } from 'react';

interface Props {
	oobCode: string;
	onSuccess: () => void;
	completePasswordReset: (oobCode: string, newPassword: string) => Promise<void>;
	loading: boolean;
	error: string | null;
}

export function ResetPasswordForm({
	oobCode,
	onSuccess,
	completePasswordReset,
	loading,
	error,
}: Props) {
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setValidationError(null);

		if (password.length < 6) {
			setValidationError('La contraseña debe tener al menos 6 caracteres.');
			return;
		}
		if (password !== confirm) {
			setValidationError('Las contraseñas no coinciden.');
			return;
		}

		try {
			await completePasswordReset(oobCode, password);
			onSuccess();
		} catch {
			// error is set in useAuth
		}
	};

	const displayError = validationError ?? error;

	return (
		<form onSubmit={handleSubmit} className='space-y-4'>
			<h2 className='text-lg font-semibold text-foreground'>
				Nueva contraseña
			</h2>
			<p className='text-sm text-muted-foreground'>
				Elige una contraseña segura para tu cuenta.
			</p>
			{displayError && (
				<p className='text-sm text-error bg-error-light border border-error/20 px-3 py-2'>
					{displayError}
				</p>
			)}
			<div>
				<label className='block text-xs font-medium text-muted-foreground mb-1'>
					Nueva contraseña
				</label>
				<div className='relative'>
					<input
						type={showPassword ? 'text' : 'password'}
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
						minLength={6}
						className='w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded pr-10'
					/>
					<button
						type='button'
						onClick={() => setShowPassword(!showPassword)}
						className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground'
					>
						{showPassword ? 'Ocultar' : 'Mostrar'}
					</button>
				</div>
			</div>
			<div>
				<label className='block text-xs font-medium text-muted-foreground mb-1'>
					Confirmar contraseña
				</label>
				<input
					type={showPassword ? 'text' : 'password'}
					value={confirm}
					onChange={e => setConfirm(e.target.value)}
					required
					className='w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded'
				/>
			</div>
			<button
				type='submit'
				disabled={loading}
				className='w-full py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
			>
				{loading ? 'Guardando...' : 'Restablecer contraseña'}
			</button>
		</form>
	);
}
