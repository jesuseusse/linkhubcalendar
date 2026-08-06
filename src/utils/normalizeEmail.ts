/**
 * Canonical form for a user email: trimmed, lowercased.
 *
 * Firebase Auth always normalizes emails to lowercase (decoded.email from a verified
 * ID token, or getUserByEmail()), but Firestore's `email` field is free-text — any code
 * path that writes it verbatim from client input can drift in casing from the Auth
 * identity. Since findByEmail() does an exact-match Firestore query, that drift makes
 * the lookup silently fail. Apply this at every read/write boundary for user.email.
 */
export function normalizeEmail(email: string | null | undefined): string {
	return (email ?? '').trim().toLowerCase();
}
