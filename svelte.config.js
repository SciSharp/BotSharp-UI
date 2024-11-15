// import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-static';
// import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// preprocess: vitePreprocess(),
	kit: {
		alias: {
			$commonTypes: './src/lib/helpers/types/commonTypes.js',
			$agentTypes: './src/lib/helpers/types/agentTypes.js',
			$conversationTypes: './src/lib/helpers/types/conversationTypes.js',
			$knowledgeTypes: './src/lib/helpers/types/knowledgeTypes.js',
			$fileTypes: './src/lib/helpers/types/fileTypes.js',
			$audioTypes: './src/lib/helpers/types/audioTypes.js',
			$userTypes: './src/lib/helpers/types/userTypes.js',
			$roleTypes: './src/lib/helpers/types/roleTypes.js',
			$pluginTypes: './src/lib/helpers/types/pluginTypes.js',
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
				"/page/agent/[agentId]/train",
				"/page/conversation",
				"/page/conversation/[conversationId]",
				"/page/task",
				"/page/task/[taskId]",
				"/page/knowledge-base",
				"/page/plugin",
				"/page/plugin/[pluginId]",
				"/page/setting",
				"/page/user/me",
				"/page/users",
				"/page/roles",
				"/chat",
				"/chat/[agentId]",
				"/chat/[agentId]/[conversationId]",
				"/page/knowledge-base/question-answer",
				"/page/knowledge-base/relationships",
				"/page/knowledge-base/documents"
			]
		}
	},

	onwarn: (warning, handler) => {
		if (warning.code.includes('a11y-')) {
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
