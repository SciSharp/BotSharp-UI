<script>
    import { onMount } from 'svelte';
    import { Card, CardBody } from '@sveltestrap/sveltestrap';
	import NavBar from "$lib/common/nav-bar/NavBar.svelte";
	import NavItem from '$lib/common/nav-bar/NavItem.svelte';
	import AgentLlmConfig from './agent-components/agent-llm-config.svelte';
	import AgentUtility from './agent-components/agent-utility.svelte';
	import AgentKnowledgeBase from './agent-components/agent-knowledge-base.svelte';
	import AgentRouting from './agent-components/agent-routing.svelte';
	import AgentEventRule from './agent-components/agent-event-rule.svelte';

    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    export const fetchData = () => {
        const utilities = agentUtilityCmp?.fetchUtilities();
        const knwoledgebases = agentKnowledgeBaseCmp?.fetchKnowledgeBases();
        const eventRules = agentEventRuleCmp?.fetchEventRules();

        return {
            utilities: utilities || [],
            knwoledgebases: knwoledgebases || [],
            eventRules: eventRules || []
        };
    };

    /** @type {any} */
    let agentUtilityCmp = null;
    /** @type {any} */
    let agentKnowledgeBaseCmp = null;
    /** @type {any} */
    let agentEventRuleCmp = null;

    /** @type {string}*/
    let selectedTab;

    /** @type {any[]}*/
    let tabs = [
        { name: 'agent-llm-config', displayText: 'LLm Config' },
        { name: 'agent-routing-rule', displayText: 'Routing Rules' },
        { name: 'agent-utility', displayText: 'Utilities' },
        { name: 'agent-knowledgebase', displayText: 'Knowledge Bases' },
        { name: 'agent-event-rule', displayText: 'Event Rules' }
    ];

    onMount(() => {
        selectedTab = tabs[0]?.name;
    });

    /** @param {string} selected */
    function handleTabClick(selected) {
        selectedTab = selected;
    }
</script>

<Card>
    <CardBody>
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

        <div class:hide={selectedTab !== 'agent-llm-config'}>
            <AgentLlmConfig agent={agent} />
        </div>
        <div class:hide={selectedTab !== 'agent-routing-rule'}>
            <AgentRouting agent={agent} />
        </div>
        <div class:hide={selectedTab !== 'agent-utility'}>
            <AgentUtility agent={agent} bind:this={agentUtilityCmp} />
        </div>
        <div class:hide={selectedTab !== 'agent-knowledgebase'}>
            <AgentKnowledgeBase agent={agent} bind:this={agentKnowledgeBaseCmp} />
        </div>
        <div class:hide={selectedTab !== 'agent-event-rule'}>
            <AgentEventRule agent={agent} bind:this={agentEventRuleCmp} />
        </div>
    </CardBody>
</Card>