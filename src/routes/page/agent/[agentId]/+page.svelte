<script>
	import {
		Col,
		Row,
        Button
	} from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';

	import AgentPrompt from './agent-prompt.svelte';
	import AgentOverview from './agent-overview.svelte';
    import AgentFunction from './agent-function.svelte';
    import AgentLlmConfig from './agent-llm-config.svelte';
    import { page } from '$app/stores';
    import { getAgent, saveAgent } from '$lib/services/agent-service.js';
    import { onMount } from 'svelte';
    const params = $page.params;
    import { _ } from 'svelte-i18n'  

    /** @type {import('$types').AgentModel} */
    let agent;

    onMount(async () => {
        agent = await getAgent(params.agentId);
    });

    async function handleAgentUpdate() {
        const result = await saveAgent(agent)
    }
</script>

<HeadTitle title="{$_('Agent Overview')}" />

<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('Agent Overview')}" />

<Row>
    {#if agent}
    <Col lg={3}>
        <AgentOverview agent={agent} />
        <AgentLlmConfig agent={agent} />
    </Col>
    <Col lg={6}>
        <AgentPrompt agent={agent} />
    </Col>
    <Col lg={3}>
        <AgentFunction agent={agent} />
    </Col>    
    {/if}
</Row>
<Row>
    <div class="hstack gap-2 my-4">
        <Button class="btn btn-soft-primary" on:click={handleAgentUpdate}>{$_('Save Agent')}</Button>
    </div>
</Row>
