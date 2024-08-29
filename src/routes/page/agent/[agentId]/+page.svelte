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
    import Swal from 'sweetalert2'
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

    onMount(() => {
        isLoading = true;
        getAgent(params.agentId).then(data => {
            agent = {
                ...data,
                llm_config: data.llm_config || {}
            };
        }).finally(() => {
            isLoading = false;
        });
    });

    function updateCurrentAgent() {
        Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to update these changes?",
            icon: 'warning',
            showCancelButton: true,
			cancelButtonText: 'No',
            confirmButtonText: 'Yes'
        }).then(async (result) => {
            if (result.value) {
                handleAgentUpdate();
            }
        });
    }

    function handleAgentUpdate() {
        fetchJsonContent();
        isLoading = true;
        agent = {
            ...agent,
            description: agent.description || '',
            instruction: agent.instruction || '',
            channel_instructions: agent.channel_instructions || [],
            profiles: agent.profiles?.filter((x, idx, self) => x?.trim()?.length > 0 && self.indexOf(x) === idx) || [],
            utilities: agent.utilities?.filter((x, idx, self) => x?.trim()?.length > 0 && self.indexOf(x) === idx) || []
        };
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
        Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to delete this agent?",
            icon: 'warning',
            showCancelButton: true,
			cancelButtonText: 'No',
            confirmButtonText: 'Yes'
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
    <Row class="agent-detail-sections">
        <Col class="section-min-width agent-overview" style="flex: 35%;">
            <div class="agent-detail-section">
                <AgentOverview agent={agent} profiles={agent.profiles || []} utilities={agent.utilities || []} />
            </div>

            <div class="agent-detail-section">
                <AgentLlmConfig agent={agent} />
                {#if agent.routing_rules?.length > 0}
                    <AgentRouting agent={agent} />
                {/if}
            </div>
        </Col>
        <Col class="section-min-width" style="flex: 65%;">
            <div class="agent-detail-section">
                <AgentPrompt agent={agent} />
            </div>
            <div class="agent-detail-section">
                <AgentFunction bind:this={agentFunctionCmp} agent={agent} />
            </div>
        </Col>
    </Row>

    {#if !!agent?.editable}
        <Row>
            <div class="hstack gap-2 my-4">
                <Button class="btn btn-soft-primary" on:click={() => updateCurrentAgent()}>{$_('Save Agent')}</Button>
                <Button class="btn btn-danger" on:click={() => deleteCurrentAgent()}>{$_('Delete Agent')}</Button>
            </div>
        </Row>
    {/if}
{/if}