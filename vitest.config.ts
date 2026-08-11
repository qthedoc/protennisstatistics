import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Standalone unit-test config — deliberately does NOT load the SvelteKit plugin so
// tests are fast and isolated. The code under test (src/lib/server/etl.ts) has no
// runtime `$lib` dependency (its only `$lib` import is `import type`, which is
// erased), but the alias is set anyway so pure helpers can be imported directly.
export default defineConfig({
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	},
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
