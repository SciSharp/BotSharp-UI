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

    /** @type {boolean} */
    let isLoading = false;
    let isComplete = false;

    const duration = 3000;
    const params = $page.params;

    onMount(() => {
        isLoading = true;
        getAgent(params.agentId).then(data => {
            agent = data;
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
            refresh();
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

    function fetchInstructions() {
        const obj = agentInstructionCmp?.fetchInstructions();
        agent.instruction = obj.systemPrompt;
        agent.channel_instructions = obj.channelPrompts || [];
    }

    function fetchTemplates() {
        agent.templates = agentTemplateCmp?.fetchTemplates();;
    }

    // Tab data
    function fetchTabData() {
        const data = agentTabsCmp?.fetchTabData();
        if (data) {
            agent.llm_config = data.llmConfig;
            agent.utilities = data.utilities || [];
            agent.knowledge_bases = data.knwoledgebases || [];
            agent.rules = data.rules || [];
            agent.mcp_tools = data.mcpTools || [];
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
            goto(`page/agent`);
        });
    }

    function refresh() {
        agentInstructionCmp?.refresh();
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
                />
            </div>
            <div class="agent-detail-section">
                <AgentTabs
                    bind:this={agentTabsCmp}
                    agent={agent}
                />
            </div>
        </Col>
        <Col class="section-min-width agent-col" style="flex: 60%;">
            <div class="agent-detail-section">
                <AgentInstruction
                    bind:this={agentInstructionCmp}
                    agent={agent}
                />
            </div>
            <div class="agent-detail-section">
                <AgentTemplate
                    bind:this={agentTemplateCmp}
                    agent={agent}
                />
            </div>
            <div class="agent-detail-section">
                <AgentFunction
                    bind:this={agentFunctionCmp}
                    agent={agent}
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