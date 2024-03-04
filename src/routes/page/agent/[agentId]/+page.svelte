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
    /** @type {any} */
    let agentFunctionCmp = null;

    onMount(async () => {
        agent = await getAgent(params.agentId);
    });

    async function handleAgentUpdate() {
        fetchJsonContent();
        const result = await saveAgent(agent)
    }

    function fetchJsonContent() {
        const content = agentFunctionCmp?.fetchContent();
        const textContent = JSON.parse(content?.text || "{}");
        const jsonContent = JSON.parse(JSON.stringify(content?.json || {}));
        agent.functions = textContent?.functions?.length > 0 ? textContent.functions :
                            (jsonContent?.functions?.length > 0 ? jsonContent?.functions : []);
        agent.responses = textContent?.responses?.length > 0 ? textContent.responses :
                            (jsonContent?.responses?.length > 0 ? jsonContent?.responses : []);
        agent.templates = textContent?.templates?.length > 0 ? textContent.templates :
                            (jsonContent?.templates?.length > 0 ? jsonContent?.templates : []);
    }
</script>

<HeadTitle title="{$_('Agent Overview')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('Agent Overview')}" />

<Row>
    {#if agent}
    <Col style="flex: 30%;">
        <AgentOverview agent={agent} />
        <AgentLlmConfig agent={agent} />
    </Col>
    <Col style="flex: 40%;">
        <AgentPrompt agent={agent} />
    </Col>
    <Col style="flex: 30%;">
        <AgentFunction bind:this={agentFunctionCmp} agent={agent} />
    </Col>    
    {/if}
</Row>
<Row>
    <div class="hstack gap-2 my-4">
        <Button class="btn btn-soft-primary" on:click={handleAgentUpdate}>{$_('Save Agent')}</Button>
    </div>
</Row>
