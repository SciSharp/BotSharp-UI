<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { page } from '$app/stores';
  import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
  import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
  import { getAgents } from '$lib/services/agent-service.js';
  import { AgentType } from '$lib/helpers/enums';
  import RoutingFlow from './routing-flow.svelte'

  const params = $page.url.searchParams;

  /** @type {import('$agentTypes').AgentModel[]} */
  let routers = $state([]);
  let isRouterNodeSelected = $state(false);
  let isAgentNodeSelected = $state(false);

  /** @type {string?} */
  let targetAgentId = $state('');

  /** @type {import('$agentTypes').AgentFilter} */
  const filter = {
    pager: { page: 1, size: 10, count: 0 },
    disabled: false,
    types: [AgentType.Routing]
  };

  onMount(async () => {
    targetAgentId = params.get('agent_id');
    await getRouter();
  });

  async function getRouter() {
    if (targetAgentId) {
      filter.agentIds = [targetAgentId];
    }
    const response = await getAgents(filter);
    if (response.items?.length > 0) {
      routers = response.items;
    }
  };

  function handleUserNodeSelected() {
    isRouterNodeSelected = false;
    isAgentNodeSelected = false;
  }

  function handleRouterNodeSelected() {
    isRouterNodeSelected = true;
    isAgentNodeSelected = true;
  }

  function handleAgentNodeSelected() {
    isRouterNodeSelected = false;
    isAgentNodeSelected = true;
  }
</script>

<HeadTitle title={$_('Routing')} />
<Breadcrumb title={$_('Agent')} pagetitle={$_('Routing')} />

{#if routers}
<div class="row">
  <div class="col">
    <RoutingFlow
      routers={routers}
      viewOnlyMode={!!targetAgentId}
      onuserNodeSelected={() => handleUserNodeSelected()}
      onrouterNodeSelected={() => handleRouterNodeSelected()}
      onagentNodeSelected={() => handleAgentNodeSelected()}/>
  </div>
</div>
{/if}

