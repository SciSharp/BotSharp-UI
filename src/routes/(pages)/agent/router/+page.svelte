<script>
  import { Col, Row } from 'sveltestrap';
  import Breadcrumb from '$lib/common/Breadcrumb.svelte';
  import HeadTitle from '$lib/common/HeadTitle.svelte';
  import { getAgents } from '$lib/services/agent-service.js';
  import RoutingFlow from './routing-flow.svelte'
  import { onMount } from 'svelte';

  /** @type {import('$types').AgentModel[]} */
  let agents;
  /** @type {import('$types').AgentModel} */
  let router;

  onMount(async () => {
    let list = await getAgents({
      isRouter: true
    });
    router = list[0];

    agents = await getAgents({
      isRouter: false,
      isEvaluator: false
    });
  });
</script>

<HeadTitle title="Router" />
<Breadcrumb title="Agent" pagetitle="Router" />

{#if router != null && agents != null}
<RoutingFlow router={router} agents={agents} />
{/if}

