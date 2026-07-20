import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		// jm-booking-client is a symlinked (pnpm link:) sibling repo — without this,
		// its `svelte` import can resolve to a second copy instead of this project's,
		// silently breaking runes/effects across the boundary. (Do NOT use
		// resolve.preserveSymlinks for this — it breaks pnpm's own symlink-heavy
		// node_modules resolution for unrelated deps like svelte's `esm-env`.)
		dedupe: ['svelte']
	},
	optimizeDeps: {
		exclude: ['jm-booking-client']
	},
	ssr: {
		noExternal: ['@svelte-plugins/datepicker', 'jm-booking-client']
	}
});
