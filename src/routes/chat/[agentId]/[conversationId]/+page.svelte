<script>
	import Chat from './chat-box.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { myInfo } from '$lib/services/auth-service.js';
	import { getAgent } from '$lib/services/agent-service.js';

	const params = $page.params;

	/** @type {import('$agentTypes').AgentModel} */
	let agent;

	/** @type {import('$userTypes').UserModel} */
	let currentUser;

    onMount(async () => {
		currentUser = await myInfo();

		// get agent profile
		let agentId = params.agentId;
		agent = await getAgent(agentId);
    });
</script>

{#if currentUser}
<Chat currentUser={currentUser} agent={agent} />
{/if}