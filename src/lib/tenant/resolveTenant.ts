import { adminDb } from '@/lib/firebase/admin';

const cache = new Map<string, { username: string; expiresAt: number }>();
const TTL = 5 * 60 * 1000;

export async function resolveTenant(domain: string): Promise<string | null> {
  const cached = cache.get(domain);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.username;
  }

  const doc = await adminDb.collection('domains').doc(domain).get();
  if (!doc.exists || !doc.data()?.verified) {
    return null;
  }

  const username = doc.data()!.username;
  cache.set(domain, { username, expiresAt: Date.now() + TTL });
  return username;
}
