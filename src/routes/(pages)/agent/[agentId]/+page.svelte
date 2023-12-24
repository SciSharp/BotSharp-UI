<script>
	import {
		Col,
		Row,
        Button
	} from 'sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';

	import AgentDetail from './agent-detail.svelte';
	import AgentOverview from './agent-overview.svelte';
    import { page } from '$app/stores';
    import { getAgent } from '$lib/services/agent-service.js';
    import { onMount } from 'svelte';
    const params = $page.params;

    /** @type {import('$types').AgentModel} */
    let agent = {};

    onMount(async () => {
        agent = await getAgent(params.agentId);
    });
</script>

<HeadTitle title="Agent Overview" />

<Breadcrumb title="Agent" pagetitle="Agent Overview" />

<Row>
    <AgentOverview agent={agent} />
    <AgentDetail agent={agent} />
</Row>
<Row>
    <div class="hstack gap-2 mb-2">
        <Button class="btn btn-soft-primary">Apply Now</Button>
    </div>
</Row>
