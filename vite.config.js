import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

// @ts-ignore
export default defineConfig(({ mode }) => {
	// Materialize PUBLIC_PRIMARY_COLOR / PUBLIC_SECONDARY_COLOR from .env into
	// an in-memory SCSS partial served by a custom Sass importer. `_variables.scss`
	// resolves these by doing `@import "env-vars";`. Nothing is written to disk.
	const env = loadEnv(mode, process.cwd(), 'PUBLIC_');
	const primary = (env.PUBLIC_PRIMARY_COLOR || '').replace(/^"|"$/g, '');
	const secondary = (env.PUBLIC_SECONDARY_COLOR || '').replace(/^"|"$/g, '');
	const scssEnv =
		(primary   ? `$env-primary: ${primary};\n`     : '') +
		(secondary ? `$env-secondary: ${secondary};\n` : '');

	return {
		// @ts-ignore
		plugins: [tailwindcss(), sveltekit(), AutoRefreshHmr()],
		ssr: {
			noExternal: ['@popperjs/core']
		},
		optimizeDeps: {
			include: [
			  'svelte',
			  '@popperjs/core', // Add @popperjs/core to the list of dependencies to include
			  "overlayscrollbars-svelte",
			  "svelte-select",
			  'lodash.get',
			  'lodash.isequal',
			  'lodash.clonedeep'
			],
			exclude: [
				"svelte-codemirror-editor",
				"codemirror",
				"@codemirror/lang-python",
				"@codemirror/view",
				"@codemirror/state",
				"@codemirror/language",
				"@codemirror/commands",
				"@codemirror/theme-one-dark"
			]
		},
		css: {
			preprocessorOptions: {
				scss: {
					silenceDeprecations: ['import', 'legacy-js-api'],
					loadPaths: ['node_modules'],
					importers: [
						{
							/** @param {string} url */
							canonicalize(url) {
								return url === 'env-vars' ? new URL('sass-virtual:env-vars') : null;
							},
							/** @param {URL} canonicalUrl */
							load(canonicalUrl) {
								if (canonicalUrl.protocol === 'sass-virtual:') {
									return { contents: scssEnv, syntax: 'scss' };
								}
								return null;
							}
						}
					]
				}
			}
		},
		server: {
			port: 5015,
			host: "0.0.0.0",
		}
	};
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