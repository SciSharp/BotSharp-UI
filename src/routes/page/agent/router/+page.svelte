<script>
  import { Col, Row } from '@sveltestrap/sveltestrap';
  import Breadcrumb from '$lib/common/Breadcrumb.svelte';
  import HeadTitle from '$lib/common/HeadTitle.svelte';
  import { getAgents } from '$lib/services/agent-service.js';
  import RoutingFlow from './routing-flow.svelte'
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n'

  /** @type {import('$types').AgentModel[]} */
  let routers;
  let isRouterNodeSelected = false;
  let isAgentNodeSelected = false;

  /** @type {import('$types').AgentFilter} */
	const filter = {
		pager: { page: 1, size: 10, count: 0 },
    disabled: false,
		type: "routing"
	};

  onMount(async () => {
    await getRouter();
  });

  async function getRouter() {
    const response = await getAgents(filter);
    if (response.items?.length > 0) {
      routers = response.items;
    }
  };

  function handleUserNodeSelected() {
    isRouterNodeSelected = false;
    isAgentNodeSelected = false;
  }

  /** @param {import('$types').AgentModel} agent */
  function handleRouterNodeSelected(agent) {
    isRouterNodeSelected = true;
    isAgentNodeSelected = true;
  }  

  /** @param {import('$types').AgentModel} agent */
  function handleAgentNodeSelected(agent) {
    isRouterNodeSelected = false;
    isAgentNodeSelected = true;
    console.log(agent);
  }
</script>

<HeadTitle title="{$_('Router')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('Router')}" />

{#if routers}
<Row>
  <Col>
    <RoutingFlow routers={routers} 
      on:userNodeSelected={(e) => handleUserNodeSelected()}
      on:routerNodeSelected={(e) => handleRouterNodeSelected(e.detail.agent)}
      on:agentNodeSelected={(e) => handleAgentNodeSelected(e.detail.agent)}/>
  </Col>    
</Row>
{/if}   

