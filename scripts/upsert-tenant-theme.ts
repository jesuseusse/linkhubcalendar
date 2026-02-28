/**
 * Upsert a tenant's full configuration into Firestore.
 *
 * Usage:
 *   yarn upsert-tenant ./scripts/tenants/clinica.json
 *   yarn upsert-tenant ./scripts/tenants/clinica.json --yes   (skip confirmation)
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import * as readline from 'readline';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

// --- Firebase Admin init ---
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
	console.error('Missing Firebase Admin credentials in .env.local');
	process.exit(1);
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

// --- Types ---
interface SesConfig {
	accessKeyId: string;
	secretAccessKey: string;
	region: string;
	fromEmail: string;
}

interface StripeConfig {
	secretKey: string;
	publishableKey: string;
	proPriceId: string;
	webhookSecret: string;
}

interface SeoConfig {
	title?: string;
	description?: string;
	ogImage?: string;
}

interface TenantConfig {
	// Required
	domain: string;
	tenantId: string;
	// Optional registry fields
	companyName?: string;
	logoUrl?: string;
	// Email providers (at least one recommended)
	sesConfig?: SesConfig;
	resendApiKey?: string;
	resendFromEmail?: string;
	// Other configs
	stripeConfig?: StripeConfig;
	seoConfig?: SeoConfig;
	// Theme
	theme?: Record<string, string>;
}

// --- Readline helper ---
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(question: string): Promise<string> {
	return new Promise((res) => rl.question(question, (a) => res(a.trim())));
}

function printDivider() {
	console.log('─'.repeat(60));
}

// --- Validation ---
const VALID_THEME_KEYS = new Set([
	'primary', 'primaryForeground', 'secondary', 'secondaryForeground',
	'background', 'foreground', 'surface', 'surfaceAlt',
	'muted', 'mutedForeground', 'border', 'ring',
	'accent', 'accentForeground',
	'success', 'successLight', 'warning', 'warningLight',
	'error', 'errorLight', 'info', 'infoLight',
	'radiusSm', 'radiusMd', 'radiusLg', 'radiusXl',
]);

function validateConfig(cfg: TenantConfig): string[] {
	const errors: string[] = [];
	if (!cfg.domain) errors.push('"domain" is required');
	if (!cfg.tenantId) errors.push('"tenantId" is required');

	if (cfg.sesConfig) {
		const s = cfg.sesConfig;
		if (!s.accessKeyId) errors.push('sesConfig.accessKeyId is required');
		if (!s.secretAccessKey) errors.push('sesConfig.secretAccessKey is required');
		if (!s.region) errors.push('sesConfig.region is required');
		if (!s.fromEmail) errors.push('sesConfig.fromEmail is required');
	}

	if (cfg.theme) {
		const unknownKeys = Object.keys(cfg.theme).filter(k => !VALID_THEME_KEYS.has(k));
		if (unknownKeys.length > 0) {
			errors.push(`Unknown theme keys: ${unknownKeys.join(', ')}`);
		}
	}

	return errors;
}

// --- Main ---
async function main() {
	const args = process.argv.slice(2);
	const filePath = args.find(a => !a.startsWith('--'));
	const autoConfirm = args.includes('--yes') || args.includes('-y');

	if (!filePath) {
		console.error('\nUsage: yarn upsert-tenant <path-to-config.json> [--yes]\n');
		console.error('  Example: yarn upsert-tenant ./scripts/tenants/clinica.json\n');
		process.exit(1);
	}

	// Read and parse the JSON file
	let cfg: TenantConfig;
	try {
		const absPath = resolve(process.cwd(), filePath);
		const raw = readFileSync(absPath, 'utf-8');
		cfg = JSON.parse(raw);
	} catch (err) {
		console.error(`\nFailed to read "${filePath}": ${err instanceof Error ? err.message : err}\n`);
		process.exit(1);
	}

	// Validate
	const errors = validateConfig(cfg);
	if (errors.length > 0) {
		console.error('\nValidation errors:');
		errors.forEach(e => console.error(`  ✗ ${e}`));
		console.error('');
		process.exit(1);
	}

	// Check existing document
	const docRef = db.collection('tenant_registry').doc(cfg.domain);
	const existing = await docRef.get();

	console.log('');
	printDivider();
	console.log(`  Tenant Upsert — ${cfg.domain}`);
	printDivider();

	if (existing.exists) {
		console.log(`  Status    : UPDATE (document exists)`);
	} else {
		console.log(`  Status    : INSERT (new document)`);
	}

	console.log(`  tenantId  : ${cfg.tenantId}`);
	if (cfg.companyName) console.log(`  company   : ${cfg.companyName}`);
	if (cfg.sesConfig) {
		console.log(`  email     : SES (${cfg.sesConfig.region}) → ${cfg.sesConfig.fromEmail}`);
	} else if (cfg.resendApiKey) {
		console.log(`  email     : Resend → ${cfg.resendFromEmail ?? '(fromEmail not set)'}`);
	} else {
		console.log(`  email     : (none configured)`);
	}
	if (cfg.stripeConfig) console.log(`  stripe    : configured`);
	if (cfg.seoConfig) console.log(`  seo       : configured`);
	if (cfg.theme) console.log(`  theme     : ${Object.keys(cfg.theme).length} keys`);

	console.log('\n  Full payload:\n');
	// Mask secrets in preview
	const preview = JSON.parse(JSON.stringify(cfg));
	if (preview.sesConfig?.secretAccessKey) preview.sesConfig.secretAccessKey = '***';
	if (preview.stripeConfig?.secretKey) preview.stripeConfig.secretKey = '***';
	if (preview.stripeConfig?.webhookSecret) preview.stripeConfig.webhookSecret = '***';
	if (preview.resendApiKey) preview.resendApiKey = '***';
	console.log(JSON.stringify(preview, null, 2));
	console.log('');
	printDivider();

	if (!autoConfirm) {
		const answer = await ask('  Save to Firestore? (y/N): ');
		if (answer.toLowerCase() !== 'y') {
			console.log('\n  Aborted.\n');
			rl.close();
			process.exit(0);
		}
	}

	// Build payload — only include keys present in the file
	const payload: Record<string, unknown> = {
		tenantId: cfg.tenantId,
		domain: cfg.domain,
	};

	if (cfg.companyName !== undefined) payload.companyName = cfg.companyName;
	if (cfg.logoUrl !== undefined) payload.logoUrl = cfg.logoUrl;
	if (cfg.sesConfig !== undefined) payload.sesConfig = cfg.sesConfig;
	if (cfg.resendApiKey !== undefined) payload.resendApiKey = cfg.resendApiKey;
	if (cfg.resendFromEmail !== undefined) payload.resendFromEmail = cfg.resendFromEmail;
	if (cfg.stripeConfig !== undefined) payload.stripeConfig = cfg.stripeConfig;
	if (cfg.seoConfig !== undefined) payload.seoConfig = cfg.seoConfig;
	if (cfg.theme !== undefined) payload.theme = cfg.theme;

	await docRef.set(payload, { merge: true });

	console.log(`\n  ✓ tenant_registry/${cfg.domain} saved.\n`);
	rl.close();
	process.exit(0);
}

main().catch((err) => {
	console.error('\nError:', err);
	rl.close();
	process.exit(1);
});
