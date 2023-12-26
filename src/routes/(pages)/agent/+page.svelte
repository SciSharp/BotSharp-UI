<script>
	import { Col, Row } from 'sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import CardAgent from './card-agent.svelte';
  import { getAgents } from '$lib/services/agent-service.js';
  import { onMount } from 'svelte';

  /** @type {import('$types').AgentModel[]} */
  let agents = [];

  onMount(async () => {
    agents = await getAgents();
  });
</script>

<HeadTitle title="Agent List" />

<Breadcrumb title="Agent" pagetitle="List" />

<Row>
	<CardAgent agents={agents} />
</Row>