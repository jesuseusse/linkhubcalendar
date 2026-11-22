/*
 * Minimal service worker: its only job is to show a friendly offline page
 * when a page navigation fails. Nothing else is cached, so booking, billing
 * and dashboard data can never be served stale. Caches are per-origin, so
 * each tenant domain keeps its own copy (multi-tenant safe).
 */
const CACHE_NAME = 'linkhub-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then(cache => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', event => {
	event.waitUntil(
		caches
			.keys()
			.then(keys =>
				Promise.all(
					keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
				)
			)
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', event => {
	if (event.request.mode !== 'navigate') return;

	event.respondWith(
		fetch(event.request).catch(() =>
			caches.match(OFFLINE_URL).then(
				cached =>
					cached ||
					new Response('Sin conexión', {
						status: 503,
						headers: { 'Content-Type': 'text/plain; charset=utf-8' }
					})
			)
		)
	);
});
