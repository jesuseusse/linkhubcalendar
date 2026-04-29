import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		globals: true,
		include: ['src/__tests__/firestore.rules.test.ts']
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src')
		}
	}
});
