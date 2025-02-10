<script>
	import {
		Col,
		Row,
        Button
	} from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
    import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import AgentPrompt from './agent-components/agent-prompt.svelte';
	import AgentOverview from './agent-components/agent-overview.svelte';
    import AgentFunction from './agent-components/agent-function.svelte';
    import AgentTabs from './agent-tabs.svelte';
    import { page } from '$app/stores';
    import { deleteAgent, getAgent, saveAgent } from '$lib/services/agent-service.js';
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n'  
    import Swal from 'sweetalert2'
	import { goto } from '$app/navigation';
	import { AgentExtensions } from '$lib/helpers/utils/agent';
    import LocalStorageManager from '$lib/helpers/utils/storage-manager';

    /** @type {import('$agentTypes').AgentModel} */
    let agent;
    /** @type {any} */
    let agentFunctionCmp = null;
    /** @type {any} */
    let agentPromptCmp = null;
    /** @type {any} */
    let agentTabsCmp = null;

    /** @type {boolean} */
    let isLoading = false;
    let isComplete = false;
    let isError = false;

    const duration = 3000;
    const params = $page.params;
    const agentStorage = new LocalStorageManager();
    let agentDraft = getAgentDraft();
    /** @type {import('$agentTypes').AgentModel} */
    let originalAgent;

    onMount(() => {
        isLoading = true;
        getAgent(params.agentId).then(data => {
            originalAgent = {
                ...data,
                llm_config: data.llm_config || {}
            };
            const agentDraft = getAgentDraft();
            if (agentDraft) {
                agent = agentDraft;
            } else {
                agent = JSON.parse(JSON.stringify(originalAgent));
            }
        }).finally(() => {
            isLoading = false;
        });
    });

    function getAgentDraft() {
        return agentStorage.get(`agent_draft_${params.agentId}`)
    }

    /** @param {any} data */
    function saveAgentDraft(data) {
        agentStorage.set(`agent_draft_${params.agentId}`, data, 24 * 60 * 60 * 1000)
    }

    function deleteAgentDraft() {
        agentStorage.remove(`agent_draft_${params.agentId}`);
    }

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
        fetchTabData();

        agent = {
            ...agent,
            description: agent.description || '',
            instruction: agent.instruction || '',
            channel_instructions: agent.channel_instructions || [],
            profiles: agent.profiles?.filter((x, idx, self) => x?.trim()?.length > 0 && self.indexOf(x) === idx) || [],
            labels: agent.labels?.filter((x, idx, self) => x?.trim()?.length > 0 && self.indexOf(x) === idx) || [],
            utilities: agent.utilities || [],
            knowledge_bases: agent.knowledge_bases || [],
            rules: agent.rules || [],
            max_message_count: Number(agent.max_message_count) > 0 ? Number(agent.max_message_count) : null,
            llm_config: {
                ...agent.llm_config,
                max_output_tokens: Number(agent.llm_config.max_output_tokens) > 0 ? Number(agent.llm_config.max_output_tokens) : null
            }
        };
        isLoading = true;
        saveAgent(agent).then(res => {
            isLoading = false;
            isComplete = true;
            deleteAgentDraft();
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

    function formatJsonContent() {
        const content = agentFunctionCmp?.fetchContent();
        const textContent = JSON.parse(content?.text || "{}");
        const jsonContent = JSON.parse(JSON.stringify(content?.json || {}));
        return {
            functions: textContent?.functions?.length > 0 ? textContent.functions :
                (jsonContent?.functions?.length > 0 ? jsonContent?.functions : []),
            responses: textContent?.responses?.length > 0 ? textContent.responses :
                (jsonContent?.responses?.length > 0 ? jsonContent?.responses : []),
            templates: textContent?.templates?.length > 0 ? textContent.templates :
                (jsonContent?.templates?.length > 0 ? jsonContent?.templates : []),
        }
    }

    function fetchJsonContent() {
        const data = formatJsonContent();
        agent.functions = data.functions;
        agent.responses = data.responses;
        agent.templates = data.templates;
    }

    function formatOriginalPrompts() {
        const obj = agentPromptCmp?.fetchOriginalChannelPrompts();
        return {
            instruction: obj.systemPrompt,
            channel_instructions: obj.channelPrompts || []
        }
    }

    function fetchPrompts() {
        const obj = agentPromptCmp?.fetchChannelPrompts();
        agent.instruction = obj.systemPrompt;
        agent.channel_instructions = obj.channelPrompts || [];
    }

    function formatOriginalTabData() {
        const data = agentTabsCmp?.fetchOriginalData();
        return data ? {
            utilities: data.utilities || [],
            knowledge_bases: data.knwoledgebases || [],
            rules: data.rules || []
        } : null;
    }
    function fetchTabData() {
        const data = agentTabsCmp?.fetchData();
        if (data) {
            agent.utilities = data.utilities || [];
            agent.knowledge_bases = data.knwoledgebases || [];
            agent.rules = data.rules || [];
        }
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
            deleteAgentDraft();
            goto(`page/agent`);
        });
    }

    function handleAgentChange() {
        const data = {
            ...agent,
            ...formatJsonContent(),
            ...formatOriginalPrompts(),
            ...formatOriginalTabData(),
        };
        saveAgentDraft(data);
    }

    function agentDraftReset() {
        agent = JSON.parse(JSON.stringify(originalAgent));
        agentDraft = null;
        deleteAgentDraft();
        setTimeout(() => {
            refreshChannelPrompts();
            agentFunctionCmp?.reinit();
            agentTabsCmp?.reinit();
        });
    }


</script>

<HeadTitle title="{$_('Agent Overview')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('Agent Overview')}" />
<LoadingToComplete isLoading={isLoading} isComplete={isComplete} isError={isError} />

{#if agent}
<div>
    {#if agentDraft}
    <button type="button" class="btn btn-sm btn-primary" on:click={agentDraftReset}>{$_('Reset')}</button>
    {/if}
    <Row class="agent-detail-sections">
        <Col class="section-min-width agent-col" style="flex: 40%;">
            <div class="agent-detail-section">
                <AgentOverview agent={agent} profiles={agent.profiles || []} labels={agent.labels || []} {handleAgentChange} />
            </div>
            <div class="agent-detail-section">
                <AgentTabs bind:this={agentTabsCmp} agent={agent} {handleAgentChange} />
            </div>
        </Col>
        <Col class="section-min-width agent-col" style="flex: 60%;">
            <div class="agent-detail-section">
                <AgentPrompt bind:this={agentPromptCmp} agent={agent} {handleAgentChange} />
            </div>
            <div class="agent-detail-section">
                <AgentFunction bind:this={agentFunctionCmp} agent={agent} {handleAgentChange} />
            </div>
        </Col>
    </Row>

    {#if !!AgentExtensions.editable(agent)}
        <Row>
            <div class="hstack gap-2 my-4">
                <Button class="btn btn-soft-primary" on:click={() => updateCurrentAgent()}>{$_('Save Agent')}</Button>
                <Button class="btn btn-danger" on:click={() => deleteCurrentAgent()}>{$_('Delete Agent')}</Button>
            </div>
        </Row>
    {/if}
</div>
{/if}