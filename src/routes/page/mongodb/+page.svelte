<script>
	import { Button } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import { refreshAgents } from '$lib/services/agent-service';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';

  let isLoading = false;
  let isComplete = false;
  let isError = false;
  const duration = 3000;

  const refreshAgentData = () => {
    isLoading = true;
    refreshAgents().then(res => {
      isComplete = true;
      isLoading = false;
      setTimeout(() => {
        isComplete = false;
      }, duration);
    }).catch(err => {
      isLoading = false;
      isComplete = false;
      isError = true;
      setTimeout(() => {
        isError = false;
      }, duration);
    });
  };

</script>

<HeadTitle title="MongoDB" />
<Breadcrumb title="MongoDB" pagetitle="Setting" />
<LoadingToComplete isLoading={isLoading} isComplete={isComplete} isError={isError} />

<h3>Migrate agents from file repository to MongoDB</h3>
<Button color="primary" on:click={() => refreshAgentData()} disabled={isLoading}>
  <i class="bx bx-copy" /> Start Migration
</Button>