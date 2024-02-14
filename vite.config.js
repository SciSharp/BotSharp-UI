import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// @ts-ignore
	plugins: [sveltekit(), AutoRefreshHmr()],
	ssr: {
		noExternal: ['@popperjs/core']
	},
	optimizeDeps: {
		include: [
		  'svelte',
		  '@popperjs/core', // Add @popperjs/core to the list of dependencies to include
		  "overlayscrollbars-svelte",
		  "svelte-select",
		  'lodash.get', 'lodash.isequal', 'lodash.clonedeep'
		],
	},	
	server: {
		port: 5015,
		host: "0.0.0.0",
	}
});

function AutoRefreshHmr() {
	return {
		name: 'auto-refresh',
		enforce: 'post',
		// @ts-ignore
		handleHotUpdate({ file, server }) {
			if (file.endsWith('.svelte') || file.endsWith('.js')) {
				server.ws.send({
					type: 'full-reload',
					path: '*'
				});
			}
		}
	};
}