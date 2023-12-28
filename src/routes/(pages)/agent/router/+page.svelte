<script>
	import { Col, Row } from 'sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
    import { getAgents } from '$lib/services/agent-service.js';
    import { onMount } from 'svelte';

  /** @type {import('$types').AgentModel[]} */
  let agents = [];

  onMount(async () => {
    agents = await getAgents();
  });
</script>

<HeadTitle title="Router" />

<Breadcrumb title="Agent" pagetitle="Router" />