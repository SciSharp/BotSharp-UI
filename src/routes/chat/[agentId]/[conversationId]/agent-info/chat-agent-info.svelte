<script>
	import { directToAgentPage } from '$lib/helpers/utils/common';

    /**
     * @type {{
     *   agent: import('$agentTypes').AgentModel
     * }}
     */
	let { agent } = $props();
</script>

<div>
    <div class="chat-agent-row">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <h3
            class="text-primary fw-bold"
            onclick={() => directToAgentPage(agent?.id)}
        >
            <span class="clickable">{agent?.name || ''}</span>
        </h3>
    </div>
    <div class="chat-agent-row">
        <div class="text-secondary">
            <span>{agent?.description || ''}</span>
        </div>
    </div>
    <div class="chat-agent-row">
        <div>
            <span>{agent?.llm_config?.provider || ''}{agent?.llm_config?.provider ? ',': ''} {agent?.llm_config?.model || ''}</span>
        </div>
    </div>
    <div class="chat-agent-row">
        <div>
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