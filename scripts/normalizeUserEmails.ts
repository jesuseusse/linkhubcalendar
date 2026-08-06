/**
 * One-time migration: normalize every user's `email` field (trim + lowercase) so it
 * always matches the Firebase Auth identity it belongs to.
 *
 * Why this matters: signup previously wrote whatever casing the client's signup form
 * submitted (see src/app/api/auth/signup/route.ts, now fixed) instead of the verified,
 * Firebase-normalized (lowercase) email. Any account created before that fix can have
 * a Firestore `email` field that doesn't match the lowercase email Firebase Auth
 * returns — and userRepo.findByEmail() does an exact-match query, so the Stripe
 * webhook (and anything else keyed by email) silently fails to find that user.
 *
 * Scans every `users` subcollection across all tenants via a collection group query.
 *
 * Run with:
 *   npx tsx scripts/normalizeUserEmails.ts --dryRun   (list what would change, no writes)
 *   npx tsx scripts/normalizeUserEmails.ts            (apply the changes)
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const DRY_RUN = process.argv.includes('--dryRun');

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
if (!projectId || !clientEmail || !privateKey) {
	console.error('Missing Firebase Admin credentials in .env');
	process.exit(1);
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

async function main() {
	const snap = await db.collectionGroup('users').get();
	console.log(`Scanning ${snap.size} user document(s) across all tenants...\n`);

	let changed = 0;
	for (const doc of snap.docs) {
		const data = doc.data();
		const current = data.email;
		if (typeof current !== 'string' || current.length === 0) continue;

		const normalized = normalizeEmail(current);
		if (normalized === current) continue;

		const tenantId = doc.ref.parent.parent?.id ?? '(unknown tenant)';
		changed++;
		console.log(`${DRY_RUN ? '[dry-run] ' : '[updating] '}tenant=${tenantId} user=${doc.id}: "${current}" -> "${normalized}"`);

		if (!DRY_RUN) {
			await doc.ref.update({ email: normalized, updatedAt: Date.now() });
		}
	}

	console.log(`\n${changed} user(s) ${DRY_RUN ? 'would be' : 'were'} updated out of ${snap.size} scanned.`);
	if (DRY_RUN && changed > 0) {
		console.log('Re-run without --dryRun to apply.');
	}
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
