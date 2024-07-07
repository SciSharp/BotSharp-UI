<script>
	import { directToAgentPage } from '$lib/helpers/utils/common';

    /** @type {import('$types').AgentModel} */
	export let agent;
</script>

<div>
    <div class="chat-agent-row">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <h3
            class="text-primary fw-bold"
            on:click={() => directToAgentPage(agent?.id)}
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
            <span>{agent?.llm_config?.provider || ''}{!!agent?.llm_config?.provider ? ',': ''} {agent?.llm_config?.model || ''}</span>
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
            <span>{agent?.utilities?.length || 0} {agent?.utilities?.length > 1 ? 'utilities' : 'utility'}</span>
            {/if}
        </div>
    </div>
</div>