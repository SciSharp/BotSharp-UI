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
	import AgentUtility from './agent-utility.svelte';
	
	
    /** @type {import('$agentTypes').AgentModel} */
    let agent;
    /** @type {any} */
    let agentFunctionCmp = null;
    /** @type {any} */
    let agentPromptCmp = null;
    /** @type {any} */
    let agentUtilityCmp = null;

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
        fetchPrompts();
        fetchUtilties();

        agent = {
            ...agent,
            description: agent.description || '',
            instruction: agent.instruction || '',
            channel_instructions: agent.channel_instructions || [],
            profiles: agent.profiles?.filter((x, idx, self) => x?.trim()?.length > 0 && self.indexOf(x) === idx) || [],
            utilities: agent.utilities || []
        };
        isLoading = true;
        saveAgent(agent).then(res => {
            isLoading = false;
			isComplete = true;
            refreshChannelPrompts();
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

    function fetchPrompts() {
        const obj = agentPromptCmp?.fetchChannelPrompts();
        agent.instruction = obj.systemPrompt;
        agent.channel_instructions = obj.channelPrompts || [];
    }

    function fetchUtilties() {
        const list = agentUtilityCmp?.fetchUtilities();
        agent.utilities = list || [];
    }

    function refreshChannelPrompts() {
        agentPromptCmp?.refreshChannelPrompts();
    }

    function deleteCurrentAgent() {
        Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to delete this agent?",
            icon: 'warning',
            customClass: { confirmButton: 'danger-background' },
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
                <AgentOverview agent={agent} profiles={agent.profiles || []} />
            </div>
            <div class="agent-detail-section">
                <AgentLlmConfig agent={agent} />
                {#if agent.routing_rules?.length > 0}
                    <AgentRouting agent={agent} />
                {/if}
            </div>
            <div class="agent-detail-section">
                <AgentUtility bind:this={agentUtilityCmp} agent={agent} />
            </div>
        </Col>
        <Col class="section-min-width" style="flex: 65%;">
            <div class="agent-detail-section">
                <AgentPrompt bind:this={agentPromptCmp} agent={agent} />
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