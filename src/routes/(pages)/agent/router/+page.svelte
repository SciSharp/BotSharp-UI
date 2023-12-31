<script>
  import { Col, Row } from '@sveltestrap/sveltestrap';
  import Breadcrumb from '$lib/common/Breadcrumb.svelte';
  import HeadTitle from '$lib/common/HeadTitle.svelte';
  import { getAgents } from '$lib/services/agent-service.js';
  import RoutingFlow from './routing-flow.svelte'
  import RoutingConfiguration from './router-configuration.svelte';
  import AgentConfiguration from './agent-configuration.svelte';
  import { onMount } from 'svelte';

  /** @type {import('$types').AgentModel} */
  let router;
  let isRouterNodeSelected = false;
  let isAgentNodeSelected = false;

  onMount(async () => {
    let list = await getAgents({
      isRouter: true
    });
    router = list[0];
  });

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

<HeadTitle title="Router" />
<Breadcrumb title="Agent" pagetitle="Router" />

{#if router}
<Row>
  <Col lg={9}>
    <RoutingFlow router={router} 
      on:userNodeSelected={(e) => handleUserNodeSelected()}
      on:routerNodeSelected={(e) => handleRouterNodeSelected(e.detail.agent)}
      on:agentNodeSelected={(e) => handleAgentNodeSelected(e.detail.agent)}/>
  </Col>    
  <Col lg={3}>
    {#if isAgentNodeSelected}
    <AgentConfiguration agent={router} />
    {/if}     
    {#if isRouterNodeSelected}
    <RoutingConfiguration router={router} />
    {/if}
  </Col>
</Row>
{/if}   

