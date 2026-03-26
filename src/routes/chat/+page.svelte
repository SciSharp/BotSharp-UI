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

<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div style="margin-top: 10vh; margin-left:10vw;">
                {#each agents as agent}
                <div>
                    <input
                        class="form-check-input m-1"
                        type="radio"
                        name="agents"
                        id={agent.id}
                        value={agent.id}
                        checked={agentId == agent.id}
                        onclick={() => agentId = agent.id}
                    />
                    <label class="form-check-label" for={agent.id}>
                        {agent.name}
                    </label>
                    <div class="mx-4">{agent.description}</div>
                </div>
                {/each}
            </div>
        </div>
    </div>
    <div class="row text-center">
        <div class="col">
            <p class="section-subtitle text-muted text-center pt-4 font-secondary">Select a bot you want to start chatting with and click the Start button.</p>
            <div class="d-flex justify-content-center">
                <a href="chat/{agentId}" class="btn btn-primary">
                    <i class="mdi mdi-chat"></i>
                    <span>Start Conversation</span>
                </a>
            </div>
        </div>
    </div>
</div>