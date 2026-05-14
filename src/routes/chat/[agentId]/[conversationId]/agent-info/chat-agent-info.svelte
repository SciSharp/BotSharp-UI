<script>
	import { directToAgentPage } from '$lib/helpers/utils/common';

    /**
     * @type {{
     *   agent: import('$agentTypes').AgentModel
     * }}
     */
	let { agent } = $props();
</script>

<div class="cai-wrapper">
    <div class="cai-row">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <h3
            class="cai-name"
            onclick={() => directToAgentPage(agent?.id)}
        >
            <span class="cai-name-link">{agent?.name || ''}</span>
        </h3>
    </div>
    <div class="cai-row">
        <div class="cai-desc">
            <span>{agent?.description || ''}</span>
        </div>
    </div>
    <div class="cai-row">
        <div class="cai-meta">
            <span>{agent?.llm_config?.provider || ''}{agent?.llm_config?.provider ? ',': ''} {agent?.llm_config?.model || ''}</span>
        </div>
    </div>
    <div class="cai-row">
        <div class="cai-meta">
            {#if !!agent?.profiles}
            <span>{agent?.profiles?.length || 0} {agent?.profiles?.length > 1 ? 'profiles' : 'profile'}{', '}</span>
            {/if}
            {#if !!agent?.functions}
            <span>{agent?.functions?.length || 0} {agent?.functions?.length > 1 ? 'functions' : 'function'}{', '}</span>
            {/if}
            {#if !!agent?.utilities}
            <span>{agent?.utilities?.length || 0} {agent?.utilities?.length > 1 ? 'utilities' : 'utility'}{', '}</span>
            {/if}
            {#if !!agent?.mcp_tools}
            <span>{agent?.mcp_tools?.length || 0} {agent?.mcp_tools?.length > 1 ? 'MCPs' : 'MCP'}</span>
            {/if}
        </div>
    </div>
</div>

<style>
    /* ===== Wrapper ===== */
    .cai-wrapper {
        display: flex;
        flex-direction: column;
    }

    /* ===== Row (replaces legacy .chat-agent-row) =====
       Centered text, modest vertical rhythm, white text by default since
       this component currently renders inside the chat-box's dark right
       log panel. */
    .cai-row {
        margin: 0.5rem 0;
        font-size: 0.875rem;
        text-align: center;
        color: rgb(255 255 255);
    }

    /* ===== Agent name (replaces .text-primary fw-bold + h3) ===== */
    .cai-name {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 700;
        line-height: 1.3;
        color: var(--color-primary);
        cursor: pointer;
        transition: filter 0.15s ease, color 0.15s ease;
    }
    .cai-name:hover {
        filter: brightness(1.15);
    }
    .cai-name-link {
        /* replaces legacy .clickable */
        cursor: pointer;
    }

    /* ===== Description (replaces .text-secondary) ===== */
    .cai-desc {
        color: var(--color-secondary);
        font-size: 0.8125rem;
        line-height: 1.45;
    }

    /* ===== Meta rows (provider/model, counts) =====
       Inherit color from the row (white on dark panel). */
    .cai-meta {
        color: inherit;
        font-size: 0.8125rem;
        opacity: 0.92;
    }
</style>