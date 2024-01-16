<script>
	import { Col, Row } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
    import { onMount } from 'svelte';

  /** @type {import('$types').AgentModel[]} */
  let agents = [];

  onMount(async () => {
    agents = await getAgents({
      isEvaluator: false
    });
  });
</script>

<HeadTitle title="MongoDB" />

<Breadcrumb title="MongoDB" pagetitle="Setting" />

<h3>Migrate agents from file repository to MongoDB</h3>
<button class="btn btn-primary btn-sm">
    <i class="bx bx-copy" /> Start Migration
</button>
