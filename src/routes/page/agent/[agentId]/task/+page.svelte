<script>
    import { Col, Row } from '@sveltestrap/sveltestrap';
    import Breadcrumb from '$lib/common/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/HeadTitle.svelte';
    import { getAgents } from '$lib/services/agent-service.js';
    import TaskFlow from './task-flow.svelte'
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    const params = $page.params;
  
    /** @type {import('$types').AgentModel} */
    let agent;
    let isRouterNodeSelected = false;
    let isAgentNodeSelected = false;
  
    /** @type {import('$types').AgentFilter} */
    const filter = {
		    pager: { page: 1, size: 20, count: 0 },
        agentIds: [params.agentId],
	  };
  
    onMount(async () => {
      const response = await getAgents(filter);
        agent = response.items[0];
    });

    function handleUserNodeSelected() {
      isRouterNodeSelected = false;
      isAgentNodeSelected = false;
    }
  
  </script>
  
  <HeadTitle title="Task Flow" />
  <Breadcrumb title="Agent" pagetitle="Task" />
  
  {#if agent}
  <Row>
    <Col>
      <TaskFlow agent={agent}
        on:userNodeSelected={(e) => handleUserNodeSelected()}/>
    </Col>    
  </Row>
  {/if}   
  
  