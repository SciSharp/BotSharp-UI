<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { page } from '$app/stores';
  import { Col, Row } from '@sveltestrap/sveltestrap';
  import Breadcrumb from '$lib/common/Breadcrumb.svelte';
  import HeadTitle from '$lib/common/HeadTitle.svelte';
  import { getAgents } from '$lib/services/agent-service.js';
	import { AgentType } from '$lib/helpers/enums';
  import RoutingFlow from './routing-flow.svelte'

  const params = $page.url.searchParams;

  /** @type {import('$agentTypes').AgentModel[]} */
  let routers;
  let isRouterNodeSelected = false;
  let isAgentNodeSelected = false;

  /** @type {string?} */
  let targetAgentId = '';

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
    if (!!targetAgentId) {
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

  /** @param {import('$agentTypes').AgentModel} agent */
  function handleRouterNodeSelected(agent) {
    isRouterNodeSelected = true;
    isAgentNodeSelected = true;
  }  

  /** @param {import('$agentTypes').AgentModel} agent */
  function handleAgentNodeSelected(agent) {
    isRouterNodeSelected = false;
    isAgentNodeSelected = true;
  }
</script>

<HeadTitle title="{$_('Routing')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('Routing')}" />

{#if routers}
<Row>
  <Col>
    <RoutingFlow
      routers={routers}
      viewMode={!!targetAgentId}
      on:userNodeSelected={(e) => handleUserNodeSelected()}
      on:routerNodeSelected={(e) => handleRouterNodeSelected(e.detail.agent)}
      on:agentNodeSelected={(e) => handleAgentNodeSelected(e.detail.agent)}/>
  </Col>    
</Row>
{/if}   

