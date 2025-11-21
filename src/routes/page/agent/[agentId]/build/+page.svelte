<script>
	import { onMount } from 'svelte';
	import { Svelvet, ThemeToggle, Group } from 'svelvet';
	import { page } from '$app/stores';
	import { getAgent } from '$lib/services/agent-service.js';
	import Thickness from './components/Thickness.svelte';
	import AzureOpenAI from './components/LlmProviders/AzureOpenAI.svelte';
	import Agent from './components/Agent.svelte';

	/** @type {number} */
	let zoom = 0.8;

	/** @type {import('$agentTypes').AgentModel} */
    let agent;

	$: agentId = $page.params.agentId;
	$: if (agentId) {
		loadAgent(agentId);
	}
    	
	onMount(async () => {});

	async function loadAgent(/** @type {string} */ id) {
		agent = await getAgent(id);
	}
</script>

<div id="svelet-agent-build">
	<Svelvet edgeStyle="step" TD {zoom} minimap controls>
		<Group
			position={{ x: -100, y: -25 }}
			width={600}
			height={700}
			color="var(--bs-primary)"
			groupName="parameters"
		>
			<Thickness />
			<AzureOpenAI />
			<!--<Scale />
			<CircleColor />
			<DashCount />-->
		</Group>
		<Agent agent={agent}/>
		<span id="state" class="note">{agent?.name}</span>
		<span id="groups" class="note">Agent Components</span>
		<ThemeToggle main="light" alt="dark" slot="toggle" />
	</Svelvet>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Reenie+Beanie&display=swap');
    #svelet-agent-build {
        height: 80vh;
        width: "100%";
    }
	.note {
		font-family: 'Reenie Beanie', sans-serif;
		position: absolute;
		color: inherit;
		width: 400px;
		transform: rotate(-3deg);
		font-weight: 200px;
		font-size: 40px;
	}
	#state {
		top: -30px;
		left: 620px;
	}
	#groups {
		top: 530px;
		left: 490px;
	}
</style>
