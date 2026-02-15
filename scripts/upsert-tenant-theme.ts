import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import * as readline from 'readline';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local first (higher priority), then .env as fallback
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

const app = initializeApp({
	credential: cert({ projectId, clientEmail, privateKey })
});
const db = getFirestore(app);

// --- Theme fields config ---
interface ThemeField {
	key: string;
	label: string;
	group: string;
}

const THEME_FIELDS: ThemeField[] = [
	{ key: 'primary', label: 'Primary', group: 'Brand' },
	{ key: 'primaryForeground', label: 'Primary Foreground', group: 'Brand' },
	{ key: 'secondary', label: 'Secondary', group: 'Brand' },
	{ key: 'secondaryForeground', label: 'Secondary Foreground', group: 'Brand' },
	{ key: 'background', label: 'Background', group: 'Surfaces' },
	{ key: 'foreground', label: 'Foreground', group: 'Surfaces' },
	{ key: 'surface', label: 'Surface', group: 'Surfaces' },
	{ key: 'surfaceAlt', label: 'Surface Alt', group: 'Surfaces' },
	{ key: 'muted', label: 'Muted', group: 'Muted' },
	{ key: 'mutedForeground', label: 'Muted Foreground', group: 'Muted' },
	{ key: 'border', label: 'Border', group: 'Borders' },
	{ key: 'ring', label: 'Ring', group: 'Borders' },
	{ key: 'accent', label: 'Accent', group: 'Accent' },
	{ key: 'accentForeground', label: 'Accent Foreground', group: 'Accent' },
	{ key: 'success', label: 'Success', group: 'Status' },
	{ key: 'successLight', label: 'Success Light', group: 'Status' },
	{ key: 'warning', label: 'Warning', group: 'Status' },
	{ key: 'warningLight', label: 'Warning Light', group: 'Status' },
	{ key: 'error', label: 'Error', group: 'Status' },
	{ key: 'errorLight', label: 'Error Light', group: 'Status' },
	{ key: 'info', label: 'Info', group: 'Status' },
	{ key: 'infoLight', label: 'Info Light', group: 'Status' },
	{ key: 'radiusSm', label: 'Radius SM', group: 'Radius' },
	{ key: 'radiusMd', label: 'Radius MD', group: 'Radius' },
	{ key: 'radiusLg', label: 'Radius LG', group: 'Radius' },
	{ key: 'radiusXl', label: 'Radius XL', group: 'Radius' },
];

// --- Readline helpers ---
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function ask(question: string): Promise<string> {
	return new Promise((resolve) => {
		rl.question(question, (answer) => resolve(answer.trim()));
	});
}

function printDivider() {
	console.log('─'.repeat(50));
}

// --- Main ---
async function main() {
	console.log('\n  Tenant Theme Upsert Script');
	console.log('  Insert or update theme in tenant_registry\n');
	printDivider();

	// 1. Prompt for domain (document ID in tenant_registry)
	const domain = await ask('Domain (tenant_registry doc ID): ');
	if (!domain) {
		console.error('Domain is required.');
		process.exit(1);
	}

	// 2. Check if document exists
	const docRef = db.collection('tenant_registry').doc(domain);
	const doc = await docRef.get();
	const existingData = doc.exists ? doc.data() : null;
	const existingTheme = existingData?.theme ?? {};

	if (doc.exists) {
		console.log(`\n  Document found for "${domain}"`);
		console.log(`  tenantId: ${existingData?.tenantId ?? '(not set)'}`);
		console.log(`  companyName: ${existingData?.companyName ?? '(not set)'}`);
		console.log(`  logoUrl: ${existingData?.logoUrl ?? '(not set)'}`);
		if (Object.keys(existingTheme).length > 0) {
			console.log('\n  Current theme:');
			for (const [k, v] of Object.entries(existingTheme)) {
				console.log(`    ${k}: ${v}`);
			}
		} else {
			console.log('\n  No theme set yet.');
		}
	} else {
		console.log(`\n  No document found for "${domain}". Will create a new one.`);
	}

	printDivider();

	// 3. If new document, prompt for tenantId
	let tenantId = existingData?.tenantId;
	if (!tenantId) {
		tenantId = await ask('tenantId (required for new docs): ');
		if (!tenantId) {
			console.error('tenantId is required.');
			process.exit(1);
		}
	}

	// 4. Prompt for optional registry fields
	console.log('\n  Registry fields (press Enter to skip / keep current):');
	const companyName = await ask(`  companyName [${existingData?.companyName ?? ''}]: `);
	const logoUrl = await ask(`  logoUrl [${existingData?.logoUrl ?? ''}]: `);

	// 5. Choose theme input mode
	console.log('\n  How do you want to set the theme?');
	console.log('    1) Paste JSON');
	console.log('    2) Load from .json file');
	console.log('    3) Field by field');
	console.log('    4) Skip (keep current theme)\n');

	const mode = await ask('  Choose (1/2/3/4): ');

	const newTheme: Record<string, string> = { ...existingTheme };
	const validKeys = new Set(THEME_FIELDS.map(f => f.key));

	if (mode === '1' || mode === '2') {
		let parsed: Record<string, unknown>;

		if (mode === '1') {
			// --- Paste JSON mode ---
			console.log('\n  Paste theme JSON (single line or multi-line, end with empty line):');
			console.log('  Example: { "primary": "#4f46e5", "background": "#fafafa" }\n');

			let jsonInput = '';
			while (true) {
				const line = await ask('  ');
				if (line === '') break;
				jsonInput += line;
			}

			if (!jsonInput) {
				console.log('  No input. Theme not modified.');
				parsed = {};
			} else {
				try {
					parsed = JSON.parse(jsonInput);
				} catch {
					console.error('\n  Invalid JSON. Theme not modified.');
					parsed = {};
				}
			}
		} else {
			// --- File mode ---
			const filePath = await ask('  Path to .json file: ');
			if (!filePath) {
				console.log('  No path provided. Theme not modified.');
				parsed = {};
			} else {
				try {
					const absPath = resolve(process.cwd(), filePath);
					const raw = readFileSync(absPath, 'utf-8');
					parsed = JSON.parse(raw);
				} catch (err) {
					console.error(`\n  Failed to read file: ${err instanceof Error ? err.message : err}`);
					parsed = {};
				}
			}
		}

		// Unwrap if nested under "tenantTheme" or "theme"
		if (parsed.tenantTheme && typeof parsed.tenantTheme === 'object') {
			parsed = parsed.tenantTheme as Record<string, unknown>;
		} else if (parsed.theme && typeof parsed.theme === 'object') {
			parsed = parsed.theme as Record<string, unknown>;
		}

		const invalidKeys: string[] = [];
		let merged = 0;

		for (const [key, value] of Object.entries(parsed)) {
			if (!validKeys.has(key)) {
				invalidKeys.push(key);
			} else if (typeof value === 'string' && value !== '') {
				newTheme[key] = value;
				merged++;
			} else if (value === null) {
				delete newTheme[key];
				merged++;
			}
		}

		if (invalidKeys.length > 0) {
			console.log(`\n  Warning: ignored unknown keys: ${invalidKeys.join(', ')}`);
		}
		if (merged > 0) {
			console.log(`  Merged ${merged} theme values.`);
		}
	} else if (mode === '3') {
		// --- Field by field mode ---
		console.log('\n  Theme colors (hex, e.g. #4f46e5). Press Enter to skip / keep current.');
		console.log('  Type "clear" to remove a value.\n');

		let lastGroup = '';

		for (const field of THEME_FIELDS) {
			if (field.group !== lastGroup) {
				console.log(`\n  [${field.group}]`);
				lastGroup = field.group;
			}

			const current = existingTheme[field.key] ?? '';
			const display = current ? ` [${current}]` : '';
			const value = await ask(`    ${field.label}${display}: `);

			if (value.toLowerCase() === 'clear') {
				delete newTheme[field.key];
			} else if (value) {
				newTheme[field.key] = value;
			}
		}
	}
	// mode === '4' or anything else: keep newTheme as-is (existing values)

	const hasThemeValues = Object.keys(newTheme).length > 0;

	// 6. Build update payload
	const payload: Record<string, unknown> = {
		tenantId,
		domain,
		theme: hasThemeValues ? newTheme : null,
	};

	if (companyName) payload.companyName = companyName;
	else if (existingData?.companyName) payload.companyName = existingData.companyName;

	if (logoUrl) payload.logoUrl = logoUrl;
	else if (existingData?.logoUrl) payload.logoUrl = existingData.logoUrl;

	// 7. Preview and confirm
	printDivider();
	console.log('\n  Preview:\n');
	console.log(JSON.stringify(payload, null, 2));
	console.log('');
	printDivider();

	const confirm = await ask('Save to Firestore? (y/N): ');
	if (confirm.toLowerCase() !== 'y') {
		console.log('Aborted.');
		rl.close();
		process.exit(0);
	}

	// 8. Upsert
	await docRef.set(payload, { merge: true });
	console.log(`\n  Done! tenant_registry/${domain} updated.\n`);

	rl.close();
	process.exit(0);
}

main().catch((err) => {
	console.error('Error:', err);
	rl.close();
	process.exit(1);
});
