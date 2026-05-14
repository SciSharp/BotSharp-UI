<script>
	import NavBar from "$lib/common/nav-bar/NavBar.svelte";
	import NavItem from '$lib/common/nav-bar/NavItem.svelte';
	import AgentLlmConfig from './agent-components/agent-llm-config.svelte';
	import AgentUtility from './agent-components/utilities/agent-utility.svelte';
	import AgentRouting from './agent-components/agent-routing.svelte';
	import AgentEventRule from './agent-components/rules/agent-rule.svelte';
	import AgentMcpTool from './agent-components/mcp-tools/agent-mcp-tool.svelte';

    /**
     * @type {{
     *   agent: import('$agentTypes').AgentModel,
     *   handleAgentChange?: () => void
     * }}
     */
    let {
        agent,
        handleAgentChange = () => {}
    } = $props();

    export function fetchTabData() {
        const llmConfig = agentLlmConfigCmp?.fetchLlmConfig();
        const utilities = agentUtilityCmp?.fetchUtilities();
        const rules = agentEventRuleCmp?.fetchRules();
        const mcpTools = agentMcpToolCmp?.fetchMcpTools();

        return {
            llmConfig,
            utilities: utilities || [],
            rules: rules || [],
            mcpTools: mcpTools || []
        };
    }

    /** @type {any} */
    let agentLlmConfigCmp = $state(null);
    /** @type {any} */
    let agentUtilityCmp = $state(null);
    /** @type {any} */
    let agentEventRuleCmp = $state(null);
    /** @type {any} */
    let agentMcpToolCmp = $state(null);

    /** @type {any[]} */
    let tabs = $state([
        { name: 'agent-llm-config', displayText: 'LLm Configs' },
        { name: 'agent-routing-rule', displayText: 'Routing' },
        { name: 'agent-utility', displayText: 'Utilities' },
        { name: 'agent-event-rule', displayText: 'Triggers & Rules' },
        { name: 'agent-mcp-tool', displayText: 'MCP Tools' }
    ]);

    /** @type {string} */
    let selectedTab = $state(tabs[0]?.name);

    /** @param {string} selected */
    function handleTabClick(selected) {
        selectedTab = selected;
    }
</script>

<div class="at-card">
    <div class="at-card-body">
        <NavBar
            disableDefaultStyles
            containerClasses={'nav-tabs-secondary'}
        >
            {#each tabs as tab, idx (idx) }
            <NavItem
                containerStyles={`flex: 0 1 calc(100% / ${tabs.length <= 2 ? tabs.length : 3})`}
                navBtnStyles={'text-transform: none;'}
                navBtnId={`${tab.name}-tab`}
                dataBsTarget={`#${tab.name}-tab`}
                ariaControls={`${tab.name}-tab-pane`}
                bind:navBtnText={tab.displayText}
                active={tab.name === selectedTab}
                onClick={() => handleTabClick(tab.name)}
            />
            {/each}
        </NavBar>

        <div class="at-pane" class:at-hide={selectedTab !== 'agent-llm-config'}>
            <AgentLlmConfig agent={agent} bind:this={agentLlmConfigCmp} {handleAgentChange} />
        </div>
        <div class="at-pane" class:at-hide={selectedTab !== 'agent-routing-rule'}>
            <AgentRouting agent={agent} />
        </div>
        <div class="at-pane" class:at-hide={selectedTab !== 'agent-utility'}>
            <AgentUtility agent={agent} bind:this={agentUtilityCmp} {handleAgentChange} />
        </div>
        <div class="at-pane" class:at-hide={selectedTab !== 'agent-event-rule'}>
            <AgentEventRule agent={agent} bind:this={agentEventRuleCmp} {handleAgentChange} />
        </div>
        <div class="at-pane" class:at-hide={selectedTab !== 'agent-mcp-tool'}>
            <AgentMcpTool agent={agent} bind:this={agentMcpToolCmp} {handleAgentChange} />
        </div>
    </div>
</div>

<style>
    .at-card {
        position: relative;
        background:
            linear-gradient(
                180deg,
                rgb(255 255 255),
                color-mix(in srgb, var(--color-primary) 1.5%, rgb(255 255 255))
            );
        border: 1px solid color-mix(in srgb, var(--color-primary) 8%, rgb(229 231 235));
        border-radius: 0.875rem;
        box-shadow:
            0 1px 0 rgb(255 255 255 / 0.7) inset,
            0 1px 2px rgb(15 23 42 / 0.04),
            0 10px 28px -16px color-mix(in srgb, var(--color-primary) 35%, rgb(15 23 42 / 0.12));
        overflow: hidden;
    }
    .at-card::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 3px;
        background: linear-gradient(
            90deg,
            transparent 0%,
            color-mix(in srgb, var(--color-primary) 65%, transparent) 25%,
            color-mix(in srgb, var(--color-primary) 65%, transparent) 75%,
            transparent 100%
        );
        opacity: 0.85;
        pointer-events: none;
    }
    .at-card-body {
        padding: 1.375rem;
    }
    .at-pane {
        margin-top: 1rem;
    }
    .at-hide {
        display: none;
    }

    :global(.dark) .at-card {
        background:
            linear-gradient(
                180deg,
                rgb(31 41 55),
                color-mix(in srgb, var(--color-primary) 6%, rgb(31 41 55))
            );
        border-color: color-mix(in srgb, var(--color-primary) 14%, rgb(55 65 81));
        box-shadow:
            0 1px 0 rgb(255 255 255 / 0.04) inset,
            0 1px 2px rgb(0 0 0 / 0.2),
            0 10px 28px -16px color-mix(in srgb, var(--color-primary) 45%, rgb(0 0 0 / 0.4));
    }
</style>