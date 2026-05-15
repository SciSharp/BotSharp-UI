<script>
    import { onMount } from 'svelte';
    import { getSettingDetail } from '$lib/services/setting-service';
    import { getAgents } from '$lib/services/agent-service.js';

    /** @type {import('$agentTypes').AgentFilter} */
    const filter = {
        pager: { page: 1, size: 10, count: 0 }
    };

    /** @type {import('$agentTypes').AgentModel[]} */
    let agents = $state([]);
    let agentId = $state('undefined');

    onMount(async () => {
        const response = await getAgents(filter, true);
        agents = response?.items?.map(t => { return { ...t }; }) || [];
        const agentSettings = await getSettingDetail("Agent");
        // @ts-ignore
        agentId = agentSettings.hostAgentId;
    });
</script>

<div class="cs-page">
    <div class="cs-block">
        <div class="cs-list">
            {#each agents as agent}
            <div class="cs-item" class:cs-item-selected={agentId == agent.id}>
                <input
                    class="cs-radio"
                    type="radio"
                    name="agents"
                    id={agent.id}
                    value={agent.id}
                    checked={agentId == agent.id}
                    onclick={() => agentId = agent.id}
                />
                <label class="cs-label" for={agent.id}>
                    {agent.name}
                </label>
                <div class="cs-desc">{agent.description}</div>
            </div>
            {/each}
        </div>
    </div>
    <div class="cs-footer">
        <p class="cs-hint">Select a bot you want to start chatting with and click the Start button.</p>
        <div class="cs-cta-wrap">
            <a href="chat/{agentId}" class="cs-start-btn">
                <i class="mdi mdi-chat"></i>
                <span>Start Conversation</span>
            </a>
        </div>
    </div>
</div>

