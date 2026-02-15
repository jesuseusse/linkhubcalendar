import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

function initClient(): FirebaseApp | null {
	if (getApps().length > 0) return getApps()[0];
	if (!firebaseConfig.apiKey) return null;
	return initializeApp(firebaseConfig);
}

const app = initClient();
const _auth = app ? getAuth(app) : (null as unknown as Auth);

/**
 * Promise that resolves once auth.tenantId has been set (or discovery is skipped).
 * Every auth consumer must `await tenantReady` before calling signIn, signUp,
 * or subscribing to onAuthStateChanged.
 */
export const tenantReady: Promise<void> =
	typeof window !== 'undefined' && _auth
		? fetch('/api/auth/tenant-discovery')
				.then(res => (res.ok ? res.json() : null))
				.then(data => {
					if (data?.tenantId) {
						_auth.tenantId = data.tenantId;
					}
				})
				.catch(() => {
					// Discovery failed — auth continues without a tenant scope
				})
		: Promise.resolve();

export const auth = _auth;
