<script>
    import { onDestroy, onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { _ } from 'svelte-i18n';
    import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
    import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
    import { deleteAgent, getAgent, saveAgent } from '$lib/services/agent-service.js';
	import { AgentExtensions } from '$lib/helpers/utils/agent';
	import { globalEventStore } from '$lib/helpers/store';
	import { GlobalEvent } from '$lib/helpers/enums';
    import AgentInstruction from './agent-components/agent-instruction.svelte';
	import AgentOverview from './agent-components/agent-overview.svelte';
    import AgentTemplate from './agent-components/templates/agent-template.svelte';
    import AgentFunction from './agent-components/agent-function.svelte';
    import AgentTabs from './agent-tabs.svelte';

    /** @type {import('$agentTypes').AgentModel} */
    let agent = $state(/** @type {any} */ (undefined));
    /** @type {any} */
    let agentFunctionCmp = $state(null);
    /** @type {any} */
    let agentInstructionCmp = $state(null);
    /** @type {any} */
    let agentTemplateCmp = $state(null);
    /** @type {any} */
    let agentTabsCmp = $state(null);
    /** @type {any} */
	let unsubscriber;

    /** @type {boolean} */
    let isLoading = $state(false);
    let isComplete = $state(false);

    const duration = 3000;

    let agentId = $derived(page.params.agentId);

    $effect(() => {
        if (agentId) {
            loadAgent(agentId);
        }
    });

    async function loadAgent(/** @type {string} */ id) {
        isLoading = true;
        agent = await getAgent(id);
        isLoading = false;
    }

    onMount(async () => {
        unsubscriber = globalEventStore.subscribe((/** @type {import('$commonTypes').GlobalEvent} */ event) => {
			if (event.name !== GlobalEvent.Search) return;

            const similarName = event.payload?.trim();
            if (similarName) {
                const url = `page/agent?page=${1}&pageSize=${12}&similarName=${encodeURIComponent(similarName)}`;
                window.location.href = url;
            }
		});
    });

    onDestroy(() => {
		unsubscriber?.();
	});

    /** @typedef {{ kind: 'update' } | { kind: 'delete' }} PendingAction */

    let confirmOpen = $state(false);
    /** @type {PendingAction | null} */
    let pendingAction = $state(null);

    function updateCurrentAgent() {
        pendingAction = { kind: 'update' };
        confirmOpen = true;
    }

    function closeConfirm() {
        confirmOpen = false;
        pendingAction = null;
    }

    function onConfirm() {
        if (!pendingAction) {
            closeConfirm();
            return;
        }
        const action = pendingAction;
        closeConfirm();
        if (action.kind === 'update') {
            handleAgentUpdate();
        } else {
            handleAgentDelete();
        }
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
        saveAgent(agent).then(() => {
            isLoading = false;
            isComplete = true;
            refresh();
            setTimeout(() => {
                isComplete = false;
            }, duration);
        }).catch(() => {
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
        pendingAction = { kind: 'delete' };
        confirmOpen = true;
    }

    function handleAgentDelete() {
        deleteAgent(agent?.id).then(() => {
            goto(`page/agent`);
        });
    }

    function exportAgent() {
        fetchJsonContent();
        fetchInstructions();
        fetchTemplates();
        fetchTabData();

        const exportData = {
            ...agent,
            created_datetime: undefined,
            updated_datetime: undefined,
            plugin: undefined,
            actions: undefined
        };

        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent-${agent.name || 'export'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function refresh() {
        agentInstructionCmp?.refresh();
    }
</script>

<HeadTitle title={$_('Agent Overview')} />
<Breadcrumb title={$_('Agent')} pagetitle={$_('Agent Overview')} />

<LoadingToComplete
    isLoading={isLoading}
    isComplete={isComplete}
/>

<ConfirmModal
    isOpen={confirmOpen}
    icon="warning"
    title="Are you sure?"
    text={pendingAction?.kind === 'delete'
        ? 'Are you sure you want to delete this agent?'
        : 'Are you sure you want to update these changes?'}
    confirmBtnText="Yes"
    cancelBtnText="No"
    confirmBtnColor={pendingAction?.kind === 'delete' ? 'danger' : 'primary'}
    confirm={onConfirm}
    cancel={closeConfirm}
    toggleModal={closeConfirm}
/>

{#if agent}
<div class="ad-page">
    <div class="ad-grid">
        <div class="ad-col ad-col-left">
            <div class="ad-section">
                <AgentOverview
                    bind:agent={agent}
                    bind:profiles={agent.profiles}
                    bind:labels={agent.labels}
                />
            </div>
            <div class="ad-section">
                <AgentTabs
                    bind:this={agentTabsCmp}
                    agent={agent}
                />
            </div>
        </div>
        <div class="ad-col ad-col-right">
            <div class="ad-section">
                <AgentInstruction
                    bind:this={agentInstructionCmp}
                    bind:agent={agent}
                />
            </div>
            <div class="ad-section">
                <AgentTemplate
                    bind:this={agentTemplateCmp}
                    bind:agent={agent}
                />
            </div>
            <div class="ad-section">
                <AgentFunction
                    bind:this={agentFunctionCmp}
                    bind:agent={agent}
                />
            </div>
        </div>
    </div>

    {#if !!AgentExtensions.editable(agent)}
        <div class="ad-action-bar">
            <button
                type="button"
                class="ad-btn ad-btn-primary"
                onclick={() => updateCurrentAgent()}
            >
                <i class="bx bx-check"></i>
                {$_('Save Agent')}
            </button>
            <button
                type="button"
                class="ad-btn ad-btn-ghost"
                onclick={() => exportAgent()}
            >
                <i class="mdi mdi-download"></i>
                {$_('Export Agent')}
            </button>
            <button
                type="button"
                class="ad-btn ad-btn-danger"
                onclick={() => deleteCurrentAgent()}
            >
                <i class="bx bx-trash"></i>
                {$_('Delete Agent')}
            </button>
        </div>
    {/if}
</div>
{/if}