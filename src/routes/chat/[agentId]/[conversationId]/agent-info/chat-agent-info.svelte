<script>
	import { directToAgentPage } from '$lib/helpers/utils/common';

    /**
     * @type {{
     *   agent: import('$agentTypes').AgentModel
     * }}
     */
	let { agent } = $props();

	/** @param {number} count @param {string} singular @param {string} plural */
	const pluralize = (count, singular, plural) => `${count || 0} ${count > 1 ? plural : singular}`;

	let stats = $derived([
		agent?.profiles && pluralize(agent.profiles.length, 'profile', 'profiles'),
		agent?.functions && pluralize(agent.functions.length, 'function', 'functions'),
		agent?.utilities && pluralize(agent.utilities.length, 'utility', 'utilities'),
		agent?.mcp_tools && pluralize(agent.mcp_tools.length, 'MCP', 'MCPs')
	].filter(Boolean).join(', '));
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
            <span>{stats}</span>
        </div>
    </div>
</div>

