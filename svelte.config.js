// import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-static';
// import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// preprocess: vitePreprocess(),
	kit: {
		alias: {
			$types: './src/lib/helpers/types.js',
		},

		// for static deployment
		paths: {
			relative: false
		},
		
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			// default options are shown. On some platforms
            // these options are set automatically — see below
            pages: 'build',
            assets: 'build',
            fallback: undefined,
            precompress: false,
            strict: true
		}),

		prerender: {
			crawl: false,
			entries: [
				"/",
				"/register",
				"/login",
				"/recoverpw",
				"/page/dashboard",
				"/page/agent",
				"/page/agent/router",
				"/page/agent/evaluator",
				"/page/agent/[agentId]",
				"/page/agent/[agentId]/build",
				"/page/conversation",
				"/page/conversation/[conversationId]",
				"/page/knowledge-base",
				"/page/plugin",
				"/page/plugin/[pluginId]",
				"/page/setting",
				"/page/mongodb",
				"/chat",
				"/chat/[agentId]",
				"/chat/[agentId]/[conversationId]",
			]
		}
	},

	onwarn: (warning, handler) => {
		if (warning.code.startsWith('a11y-')) {
			return;
		}
		handler(warning);
	},
	
	vite: {
		optimizeDeps: {
			include: ['lodash.get', 'lodash.isequal', 'lodash.clonedeep']
		}
	}
};

export default config;
