<script>
    import { onDestroy, onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { _ } from 'svelte-i18n';
    import Swal from 'sweetalert2';
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

<style>
    .ad-page {
        display: flex;
        flex-direction: column;
    }

    /* ===== Two-column grid (40 / 60) =====
       Uses CSS Grid so columns are explicitly sized; flex would wrap because
       the cards' min-content is wider than 40% of the page. */
    .ad-grid {
        display: grid;
        grid-template-columns: 2fr 3fr;
        gap: 1.125rem;
    }
    .ad-col {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
        min-width: 0;
    }
    @media (max-width: 991.98px) {
        .ad-grid {
            grid-template-columns: minmax(0, 1fr);
        }
    }

    /* ===== Section wrapper =====
       Each ad-section hosts a panel card. The card itself owns its background
       and shadow; we just give a smooth transform-on-hover affordance to lift
       the card subtly when the user is interacting with this region. */
    .ad-section {
        display: block;
        transition: transform 0.2s ease, filter 0.2s ease;
    }
    .ad-section:hover {
        transform: translateY(-1px);
    }
    @media (max-width: 423px) {
        .ad-section {
            height: fit-content;
        }
    }

    /* ===== Action bar (Save / Delete) ===== */
    .ad-action-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.625rem;
        margin: 1.75rem 0 1rem;
        padding: 0.875rem 1rem;
        background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--color-primary) 4%, transparent),
            transparent 65%
        );
        border-radius: 0.875rem;
    }

    /* ===== Buttons ===== */
    .ad-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        height: 2.375rem;
        padding: 0 1.125rem;
        font-size: 0.8125rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        line-height: 1;
        border: 1px solid transparent;
        border-radius: 0.625rem;
        cursor: pointer;
        transition:
            background 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease,
            transform 0.12s ease,
            box-shadow 0.18s ease,
            filter 0.18s ease;
    }
    .ad-btn:active:not(:disabled) {
        transform: translateY(1px);
    }
    .ad-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .ad-btn i {
        font-size: 1rem;
        line-height: 1;
    }
    .ad-btn-primary {
        background: linear-gradient(
            135deg,
            var(--color-primary),
            color-mix(in srgb, var(--color-primary) 78%, black)
        );
        color: rgb(255 255 255);
        box-shadow:
            0 1px 0 rgb(255 255 255 / 0.18) inset,
            0 4px 12px -4px color-mix(in srgb, var(--color-primary) 60%, transparent),
            0 2px 4px -2px rgb(15 23 42 / 0.1);
    }
    .ad-btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow:
            0 1px 0 rgb(255 255 255 / 0.22) inset,
            0 8px 18px -6px color-mix(in srgb, var(--color-primary) 70%, transparent),
            0 3px 6px -2px rgb(15 23 42 / 0.12);
        filter: brightness(1.05);
    }
    .ad-btn-danger {
        background: linear-gradient(
            135deg,
            var(--color-danger),
            color-mix(in srgb, var(--color-danger) 78%, black)
        );
        color: rgb(255 255 255);
        box-shadow:
            0 1px 0 rgb(255 255 255 / 0.18) inset,
            0 4px 12px -4px color-mix(in srgb, var(--color-danger) 55%, transparent),
            0 2px 4px -2px rgb(15 23 42 / 0.1);
    }
    .ad-btn-danger:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow:
            0 1px 0 rgb(255 255 255 / 0.22) inset,
            0 8px 18px -6px color-mix(in srgb, var(--color-danger) 65%, transparent),
            0 3px 6px -2px rgb(15 23 42 / 0.12);
        filter: brightness(1.05);
    }

    /* Ghost / secondary variant for non-destructive auxiliary actions
       (e.g. Export Agent). Sits visually quieter than the filled
       primary/danger gradients while still picking up the design tokens
       on hover so the action bar reads as a unified cluster. */
    .ad-btn-ghost {
        background-color: rgb(255 255 255);
        border-color: color-mix(in srgb, var(--color-primary) 35%, rgb(229 231 235));
        color: var(--color-primary);
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 1px 0 rgb(255 255 255 / 0.6) inset;
    }
    .ad-btn-ghost:hover:not(:disabled) {
        background-color: color-mix(in srgb, var(--color-primary) 8%, rgb(255 255 255));
        border-color: var(--color-primary);
        transform: translateY(-1px);
        box-shadow:
            0 4px 10px -4px color-mix(in srgb, var(--color-primary) 35%, transparent),
            0 1px 0 rgb(255 255 255 / 0.6) inset;
    }
    :global(.dark) .ad-btn-ghost {
        background-color: rgb(31 41 55);
        border-color: color-mix(in srgb, var(--color-primary) 45%, rgb(55 65 81));
        color: color-mix(in srgb, var(--color-primary) 85%, white);
    }
    :global(.dark) .ad-btn-ghost:hover:not(:disabled) {
        background-color: color-mix(in srgb, var(--color-primary) 18%, rgb(31 41 55));
    }

    :global(.dark) .ad-action-bar {
        background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--color-primary) 10%, transparent),
            transparent 65%
        );
    }
</style>