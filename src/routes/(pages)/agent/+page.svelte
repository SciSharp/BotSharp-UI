<script>
	import { Col, Row } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import CardAgent from './card-agent.svelte';
  import { getAgents } from '$lib/services/agent-service.js';
  import { onMount } from 'svelte';

  /** @type {import('$types').AgentModel[]} */
  let agents = [];

  onMount(async () => {
    agents = await getAgents({
      isEvaluator: false
    });
  });
</script>

<HeadTitle title="Agent List" />

<Breadcrumb title="Agent" pagetitle="List" />

<Row>
	<CardAgent agents={agents} />
</Row>