<script>
	import { page } from '$app/state';
	import { myInfo } from '$lib/services/auth-service.js';
	import { getAgent } from '$lib/services/agent-service.js';
	import Chat from './chat-box.svelte';

	/** @type {import('$agentTypes').AgentModel} */
	let agent = $state(/** @type {any} */ (undefined));

	/** @type {import('$userTypes').UserModel} */
	let currentUser = $state(/** @type {any} */ (undefined));

	let agentId = $derived(page.params.agentId);

	$effect(() => {
		if (agentId) {
			loadData(agentId);
		}
	});

	async function loadData(/** @type {string} */ id) {
		currentUser = await myInfo();
		agent = await getAgent(id);
	}
</script>

{#if currentUser}
	<Chat currentUser={currentUser} agent={agent} />
{/if}