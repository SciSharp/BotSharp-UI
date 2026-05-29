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
            <span>
                {[agent?.llm_config?.provider, agent?.llm_config?.model, agent?.llm_config?.reasoning_effort_level].filter(Boolean).join(', ')}
            </span>
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

