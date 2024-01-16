<script>
	import { Alert, Button, Col, Row } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
  import { onMount } from 'svelte';
	import { refreshAgents } from '$lib/services/agent-service';

  /** @type {import('$types').AgentModel[]} */
  let agents = [];
  let isLoading = false;
  let isComplete = false;

  const refreshAgentData = () => {
    isLoading = true;
    refreshAgents().then(res => {
      isComplete = true;
      isLoading = false;
      setTimeout(() => {
        isComplete = false;
      }, 3000);
    }).catch(err => {
      isLoading = false;
    });
  };

  onMount(async () => {
    agents = await getAgents({
      isEvaluator: false
    });
  });
</script>

<HeadTitle title="MongoDB" />

<Breadcrumb title="MongoDB" pagetitle="Setting" />

{#if isLoading}
  <Alert color="secondary">
    <div>In Progress...</div>
  </Alert>
{/if}

{#if isComplete}
  <Alert color="success">
    <div>Update comppleted!</div>
  </Alert>
{/if}

<h3>Migrate agents from file repository to MongoDB</h3>
<Button color="primary" on:click={() => refreshAgentData()}>
  <i class="bx bx-copy" /> Start Migration
</Button>