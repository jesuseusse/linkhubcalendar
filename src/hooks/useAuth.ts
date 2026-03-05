'use client';

import { useState, useCallback } from 'react';
import { IAuthService } from '@/interfaces/IAuthService';
import { IProfileService } from '@/interfaces/IProfileService';
import { LoginDto, SignUpDto } from '@/dtos/auth.dto';
import { useAuthContext } from '@/context/AuthContext';
import { isPlanExpired } from '@/utils/planExpiration';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

export function useAuth(
	authService: IAuthService,
	profileService?: IProfileService
) {
	const { setAuth, logout, token, user } = useAuthContext();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const login = useCallback(
		async (dto: LoginDto) => {
			setLoading(true);
			setError(null);
			try {
				const result = await authService.login(dto);
				setAuth(result.token, result.user);
				if (result.user.plan !== 'free' || result.user.plan === undefined) {
					if (profileService && isPlanExpired(result.user.planExpiredAt)) {
						try {
							const downgraded = await profileService.downgradePlan(
								result.token
							);
							setAuth(result.token, downgraded);
						} catch {
							// Downgrade failed silently
						}
					}
				}
			} catch (err: unknown) {
				const message = getFirebaseErrorMessage(
					err,
					'Error al iniciar sesión.'
				);

				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[authService, profileService, setAuth]
	);

	const signUp = useCallback(
		async (dto: SignUpDto) => {
			setLoading(true);
			setError(null);
			try {
				const result = await authService.signUp(dto);
				setAuth(result.token, result.user);
				localStorage.removeItem('referral_code');
			} catch (err: unknown) {
				const message = getFirebaseErrorMessage(
					err,
					'Error al crear la cuenta.'
				);
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[authService, setAuth]
	);

	return {
		login,
		signUp,
		logout,
		loading,
		error,
		isAuthenticated: !!token,
		user
	};
}
