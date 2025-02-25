<script>
	import {
		Col,
		Row,
        Button
	} from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
    import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import AgentInstruction from './agent-components/agent-instruction.svelte';
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
	import AgentTemplate from './agent-components/agent-template.svelte';

    /** @type {import('$agentTypes').AgentModel} */
    let agent;
    /** @type {any} */
    let agentFunctionCmp = null;
    /** @type {any} */
    let agentInstructionCmp = null;
    /** @type {any} */
    let agentTemplateCmp = null;
    /** @type {any} */
    let agentTabsCmp = null;
    /** @type {import('$agentTypes').AgentModel} */
    let originalAgent;
    /** @type {any} */
    let agentDraft = null;

    /** @type {boolean} */
    let isLoading = false;
    let isComplete = false;

    const duration = 3000;
    const params = $page.params;
    const agentStorage = new LocalStorageManager();
    

    onMount(() => {
        isLoading = true;
        agentDraft = getAgentDraft();
        getAgent(params.agentId).then(data => {
            originalAgent = {
                ...data,
                llm_config: data.llm_config || {}
            };
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
        fetchInstructions();
        fetchTemplates();
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
            max_message_count: Number(agent.max_message_count) > 0 ? Number(agent.max_message_count) : null
        };
        isLoading = true;
        saveAgent(agent).then(res => {
            isLoading = false;
            isComplete = true;
            deleteAgentDraft();
            refreshInstructions();
            refreshTemplates();
            setTimeout(() => {
                isComplete = false;
            }, duration);
        }).catch(err => {
            isLoading = false;
            isComplete = false;
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
                (jsonContent?.responses?.length > 0 ? jsonContent?.responses : [])
        }
    }

    // Functions, responses
    function fetchJsonContent() {
        const data = formatJsonContent();
        agent.functions = data.functions;
        agent.responses = data.responses;
    }

    // Insturctions
    function formatOriginalInstructions() {
        const obj = agentInstructionCmp?.fetchOriginalInstructions();
        return {
            instruction: obj.systemPrompt,
            channel_instructions: obj.channelPrompts || []
        }
    }

    function fetchInstructions() {
        const obj = agentInstructionCmp?.fetchInstructions();
        agent.instruction = obj.systemPrompt;
        agent.channel_instructions = obj.channelPrompts || [];
    }

    function refreshInstructions() {
        agentInstructionCmp?.refresh();
    }

    // Templates
    function formatOriginalTemplates() {
        const obj = agentTemplateCmp?.fetchOriginalTemplates();
        return {
            templates: obj.templates || []
        }
    }

    function fetchTemplates() {
        const obj = agentTemplateCmp?.fetchTemplates();
        agent.templates = obj.templates || [];
    }

    function refreshTemplates() {
        agentTemplateCmp?.refresh();
    }


    // Tab data
    function formatOriginalTabData() {
        const data = agentTabsCmp?.fetchOriginalTabData();
        return data ? {
            utilities: data.utilities || [],
            knowledge_bases: data.knwoledgebases || [],
            rules: data.rules || []
        } : null;
    }

    function fetchTabData() {
        const data = agentTabsCmp?.fetchTabData();
        if (data) {
            agent.llm_config = data.llmConfig;
            agent.utilities = data.utilities || [];
            agent.knowledge_bases = data.knwoledgebases || [];
            agent.rules = data.rules || [];
        }
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
            ...formatOriginalInstructions(),
            ...formatOriginalTemplates(),
            ...formatOriginalTabData(),
        };
        saveAgentDraft(data);
    }

    function handleAgentReset() {
        agent = JSON.parse(JSON.stringify(originalAgent));
        agentDraft = null;
        deleteAgentDraft();
        setTimeout(() => {
            refreshInstructions();
            refreshTemplates();
            agentFunctionCmp?.refresh();
            agentTabsCmp?.refresh();
        });
    }
</script>

<HeadTitle title="{$_('Agent Overview')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('Agent Overview')}" />
<LoadingToComplete isLoading={isLoading} isComplete={isComplete} />

{#if agent}
<div>
    <Row class="agent-detail-sections">
        <Col class="section-min-width agent-col" style="flex: 40%;">
            <div class="agent-detail-section">
                <AgentOverview
                    agent={agent}
                    profiles={agent.profiles || []}
                    labels={agent.labels || []}
                    resetable={!!agentDraft}
                    resetAgent={() => handleAgentReset()}
                    {handleAgentChange}
                />
            </div>
            <div class="agent-detail-section">
                <AgentTabs
                    bind:this={agentTabsCmp}
                    agent={agent}
                    {handleAgentChange}
                />
            </div>
        </Col>
        <Col class="section-min-width agent-col" style="flex: 60%;">
            <div class="agent-detail-section">
                <AgentInstruction
                    bind:this={agentInstructionCmp}
                    agent={agent}
                    {handleAgentChange}
                />
            </div>
            <div class="agent-detail-section">
                <AgentTemplate
                    bind:this={agentTemplateCmp}
                    agent={agent}
                    {handleAgentChange}
                />
            </div>
            <div class="agent-detail-section">
                <AgentFunction
                    bind:this={agentFunctionCmp}
                    agent={agent}
                    {handleAgentChange}
                />
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