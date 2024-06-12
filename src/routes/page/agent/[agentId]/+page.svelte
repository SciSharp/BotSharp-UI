<script>
	import {
		Col,
		Row,
        Button
	} from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
    import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import AgentPrompt from './agent-prompt.svelte';
	import AgentOverview from './agent-overview.svelte';
    import AgentRouting from './agent-routing.svelte';
    import AgentFunction from './agent-function.svelte';
    import AgentLlmConfig from './agent-llm-config.svelte';
    import { page } from '$app/stores';
    import { deleteAgent, getAgent, saveAgent } from '$lib/services/agent-service.js';
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n'  
    import Swal from 'sweetalert2/dist/sweetalert2.js';
    import "sweetalert2/src/sweetalert2.scss";
	import { goto } from '$app/navigation';
	
	
    /** @type {import('$types').AgentModel} */
    let agent;
    /** @type {any} */
    let agentFunctionCmp = null;

    /** @type {boolean} */
    let isLoading = false;
    let isComplete = false;
    let isError = false;

    const duration = 3000;
    const params = $page.params;

    onMount(async () => {
        agent = await getAgent(params.agentId);
    });

    function updateCurrentAgent() {
        // @ts-ignore
        Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to update these changes?",
            icon: 'warning',
            showCancelButton: true,
			cancelButtonText: 'No',
            confirmButtonText: 'Yes'
        // @ts-ignore
        }).then(async (result) => {
            if (result.value) {
                handleAgentUpdate();
            }
        });
    }

    function handleAgentUpdate() {
        fetchJsonContent();
        isLoading = true;
        agent.description = agent.description || '';
        agent.instruction = agent.instruction || '';
        saveAgent(agent).then(res => {
            isLoading = false;
			isComplete = true;
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

    function deleteCurrentAgent() {
        // @ts-ignore
        Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to delete this agent?",
            icon: 'warning',
            showCancelButton: true,
			cancelButtonText: 'No',
            confirmButtonText: 'Yes'
        // @ts-ignore
        }).then(async (result) => {
            if (result.value) {
                handleAgentDelete();
            }
        });
    }

    function handleAgentDelete() {
        deleteAgent(agent?.id).then(res => {
            goto(`page/agent`);
        });
    }
</script>

<HeadTitle title="{$_('Agent Overview')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('Agent Overview')}" />
<LoadingToComplete isLoading={isLoading} isComplete={isComplete} isError={isError} />

{#if agent}
<Row>
    <Col style="flex: 30%;">
        <AgentOverview agent={agent} />
        <AgentLlmConfig agent={agent} />
        {#if agent.routing_rules?.length > 0}
            <AgentRouting agent={agent} />
        {/if}
    </Col>
    <Col style="flex: 40%;">
        <AgentPrompt agent={agent} />
    </Col>
    <Col style="flex: 30%;">
        <AgentFunction bind:this={agentFunctionCmp} agent={agent} />
    </Col>    
</Row>
    {#if !!agent?.editable}
    <Row>
        <div class="hstack gap-2 my-4">
            <Button class="btn btn-soft-primary" on:click={updateCurrentAgent}>{$_('Save Agent')}</Button>
            <Button class="btn btn-danger" on:click={deleteCurrentAgent}>{$_('Delete Agent')}</Button>
        </div>
    </Row>
    {/if}
{/if}