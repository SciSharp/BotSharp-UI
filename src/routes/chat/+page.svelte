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

<style>
    /* ===== Page shell ===== */
    .cs-page {
        width: 100%;
        padding: 0 1rem;
    }

    /* ===== Agent list block ===== */
    .cs-block {
        margin-top: 10vh;
        margin-left: 10vw;
        margin-right: 10vw;
    }
    .cs-list {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
    }
    .cs-item {
        padding: 0.875rem 1rem;
        border: 1px solid color-mix(in srgb, var(--color-primary) 8%, rgb(229 231 235));
        border-radius: 0.625rem;
        background-color: rgb(255 255 255);
        transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
    }
    .cs-item:hover {
        border-color: color-mix(in srgb, var(--color-primary) 32%, rgb(229 231 235));
        background-color: color-mix(in srgb, var(--color-primary) 2%, rgb(255 255 255));
    }
    .cs-item-selected {
        border-color: var(--color-primary);
        background-color: color-mix(in srgb, var(--color-primary) 5%, rgb(255 255 255));
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 14%, transparent);
    }

    /* ===== Radio (themed, replaces .form-check-input) ===== */
    .cs-radio {
        width: 1rem;
        height: 1rem;
        margin: 0 0.5rem 0 0;
        vertical-align: middle;
        accent-color: var(--color-primary);
        cursor: pointer;
    }
    .cs-label {
        font-size: 0.9375rem;
        font-weight: 600;
        color: rgb(55 65 81);
        vertical-align: middle;
        cursor: pointer;
        margin: 0;
    }
    .cs-desc {
        margin: 0.25rem 0 0 1.5rem;
        font-size: 0.8125rem;
        color: var(--color-muted);
        line-height: 1.5;
    }

    /* ===== Footer / CTA ===== */
    .cs-footer {
        text-align: center;
        padding-top: 1.5rem;
        padding-bottom: 2.5rem;
    }
    .cs-hint {
        margin: 0 0 1rem 0;
        font-size: 0.8125rem;
        color: var(--color-muted);
    }
    .cs-cta-wrap {
        display: flex;
        justify-content: center;
    }
    .cs-start-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        height: 2.5rem;
        padding: 0 1.25rem;
        font-size: 0.875rem;
        font-weight: 600;
        line-height: 1;
        color: rgb(255 255 255);
        text-decoration: none;
        border: 1px solid transparent;
        border-radius: 0.625rem;
        background: linear-gradient(
            135deg,
            var(--color-primary),
            color-mix(in srgb, var(--color-primary) 78%, black)
        );
        box-shadow:
            0 1px 0 rgb(255 255 255 / 0.18) inset,
            0 4px 12px -4px color-mix(in srgb, var(--color-primary) 60%, transparent),
            0 2px 4px -2px rgb(15 23 42 / 0.1);
        transition: transform 0.12s ease, box-shadow 0.18s ease, filter 0.18s ease;
        cursor: pointer;
    }
    .cs-start-btn:hover {
        transform: translateY(-1px);
        box-shadow:
            0 1px 0 rgb(255 255 255 / 0.22) inset,
            0 8px 18px -6px color-mix(in srgb, var(--color-primary) 70%, transparent),
            0 3px 6px -2px rgb(15 23 42 / 0.12);
        filter: brightness(1.05);
        color: rgb(255 255 255);
    }
    .cs-start-btn:active {
        transform: translateY(1px);
    }
    .cs-start-btn i {
        font-size: 1rem;
        line-height: 1;
    }

    /* ===== Dark mode ===== */
    :global(.dark) .cs-item {
        background-color: rgb(31 41 55);
        border-color: color-mix(in srgb, var(--color-primary) 14%, rgb(55 65 81));
    }
    :global(.dark) .cs-item:hover {
        background-color: color-mix(in srgb, var(--color-primary) 6%, rgb(31 41 55));
    }
    :global(.dark) .cs-item-selected {
        background-color: color-mix(in srgb, var(--color-primary) 10%, rgb(31 41 55));
    }
    :global(.dark) .cs-label {
        color: rgb(229 231 235);
    }
</style>