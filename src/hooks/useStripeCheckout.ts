'use client';

import { useState, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';

export function useStripeCheckout(interval: 'month' | 'year' = 'month') {
	const { user, token } = useAuthContext();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const checkout = useCallback(async () => {
		if (!user?.emailVerified) {
			setError('Debe verificar su correo electrónico primero');
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ interval })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? 'Error al iniciar el pago');
			window.location.href = data.url;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al iniciar el pago');
		} finally {
			setLoading(false);
		}
	}, [user, token, interval]);

	return { checkout, loading, error };
}
