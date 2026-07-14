'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/Auth/LoginForm';
import { SignUpForm } from '@/components/Auth/SignUpForm';
import { ForgotPasswordForm } from '@/components/Auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/Auth/ResetPasswordForm';
import { useAuth } from '@/hooks/useAuth';
import { authService, profileService } from '@/services/serviceFactory';
import ReferralCapture from '@/components/Common/ReferralCapture';

type Mode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

export default function AuthPage() {
	const searchParams = useSearchParams();
	const oobCode = searchParams.get('oobCode') ?? '';
	const initialMode: Mode = oobCode
		? 'reset-password'
		: searchParams.get('mode') === 'signup'
			? 'signup'
			: 'login';

	const [mode, setMode] = useState<Mode>(initialMode);
	const [resetSuccess, setResetSuccess] = useState(false);
	const { login, signUp, completePasswordReset, loading, error, isAuthenticated } =
		useAuth(authService, profileService);
	const router = useRouter();

	useEffect(() => {
		if (isAuthenticated) {
			router.push('/u/admin/dashboard');
		}
	}, [isAuthenticated, router]);

	const goToLogin = () => {
		setMode('login');
		router.replace('?mode=login');
	};

	return (
		<div className='min-h-screen bg-background flex items-center justify-center p-4'>
			<ReferralCapture />
			<div className='w-full max-w-sm'>
				<h1 className='text-2xl font-bold text-foreground text-center mb-6'>
					Bienvenido
				</h1>
				{resetSuccess && mode === 'login' && (
					<p className='mb-4 text-sm text-center px-3 py-2 bg-surface border border-border text-foreground'>
						Contraseña restablecida. Ya puedes iniciar sesión.
					</p>
				)}
				{mode === 'login' && (
					<LoginForm
						onSubmit={login}
						loading={loading}
						error={error}
						onSwitchToSignUp={() => {
							setMode('signup');
							router.replace('?mode=signup');
						}}
						onForgotPassword={() => setMode('forgot-password')}
					/>
				)}
				{mode === 'signup' && (
					<SignUpForm
						onSubmit={signUp}
						loading={loading}
						error={error}
						onSwitchToLogin={goToLogin}
					/>
				)}
				{mode === 'forgot-password' && (
					<ForgotPasswordForm onBack={goToLogin} />
				)}
				{mode === 'reset-password' && (
					<ResetPasswordForm
						oobCode={oobCode}
						completePasswordReset={completePasswordReset}
						loading={loading}
						error={error}
						onSuccess={() => {
							setResetSuccess(true);
							goToLogin();
						}}
					/>
				)}
			</div>
		</div>
	);
}
