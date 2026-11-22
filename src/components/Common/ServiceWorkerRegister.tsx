'use client';

import { useEffect } from 'react';

/** Registers the minimal offline-fallback service worker (production only). */
export default function ServiceWorkerRegister() {
	useEffect(() => {
		if (process.env.NODE_ENV !== 'production') return;
		if (!('serviceWorker' in navigator)) return;

		navigator.serviceWorker.register('/sw.js').catch(() => {
			// Registration is best-effort: the app works the same without it.
		});
	}, []);

	return null;
}
