'use client';

import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode
} from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, tenantReady } from '@/lib/firebase/client';
import { UserDto } from '@/dtos/user.dto';
import { apiClient } from '@/services/apiClient';

interface AuthState {
	token: string | null;
	user: UserDto | null;
	loading: boolean;
}

interface AuthContextValue extends Omit<AuthState, 'loading'> {
	loading: boolean;
	setAuth: (token: string, user: UserDto) => void;
	updateUser: (user: UserDto) => void;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<AuthState>({
		token: null,
		user: null,
		loading: !!auth
	});

	useEffect(() => {
		if (!auth) return;
		let unsubscribe: (() => void) | undefined;

		tenantReady.then(() => {
			unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
				if (firebaseUser) {
					await firebaseUser.reload();
					const token = await firebaseUser.getIdToken(true);
					try {
						const user = await apiClient('/api/profile');

						setState({
							token,
							user: {
								...user,
								emailVerified: firebaseUser.emailVerified
							},
							loading: false
						});
					} catch {
						setState({ token, user: null, loading: false });
					}
				} else {
					setState({ token: null, user: null, loading: false });
				}
			});
		});

		return () => unsubscribe?.();
	}, []);

	const setAuth = useCallback((token: string, user: UserDto) => {
		setState({ token, user, loading: false });
	}, []);

	const updateUser = useCallback((user: UserDto) => {
		setState(prev => ({
			...prev,
			user: { ...user, emailVerified: prev.user?.emailVerified ?? user.emailVerified }
		}));
	}, []);

	const logout = useCallback(async () => {
		await signOut(auth);
		setState({ token: null, user: null, loading: false });
	}, []);

	if (state.loading) {
		return null;
	}

	return (
		<AuthContext.Provider
			value={{
				token: state.token,
				user: state.user,
				loading: state.loading,
				setAuth,
				updateUser,
				logout
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuthContext() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
	return ctx;
}
