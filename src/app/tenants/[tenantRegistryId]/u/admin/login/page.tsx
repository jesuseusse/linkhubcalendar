'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/Auth/LoginForm';
import { SignUpForm } from '@/components/Auth/SignUpForm';
import { useAuth } from '@/hooks/useAuth';
import { authService, profileService } from '@/services/serviceFactory';

export default function AuthPage() {
	const [mode, setMode] = useState<'login' | 'signup'>('login');
	const { login, signUp, loading, error, isAuthenticated } = useAuth(
		authService,
		profileService
	);
	const router = useRouter();

	useEffect(() => {
		if (isAuthenticated) {
			router.push('/u/admin/dashboard');
		}
	}, [isAuthenticated, router]);

	return (
		<div className='min-h-screen bg-background flex items-center justify-center p-4'>
			<div className='w-full max-w-sm'>
				<h1 className='text-2xl font-bold text-foreground text-center mb-6'>
					Bienvenido
				</h1>
				{mode === 'login' ? (
					<LoginForm
						onSubmit={login}
						loading={loading}
						error={error}
						onSwitchToSignUp={() => setMode('signup')}
					/>
				) : (
					<SignUpForm
						onSubmit={signUp}
						loading={loading}
						error={error}
						onSwitchToLogin={() => setMode('login')}
					/>
				)}
			</div>
		</div>
	);
}
