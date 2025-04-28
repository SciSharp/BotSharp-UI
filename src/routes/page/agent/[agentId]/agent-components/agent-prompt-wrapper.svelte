<script>
    import { onMount } from 'svelte';
    import { Card, CardBody } from '@sveltestrap/sveltestrap';
	import NavBar from "$lib/common/nav-bar/NavBar.svelte";
	import NavItem from '$lib/common/nav-bar/NavItem.svelte';
	import AgentTemplate from './agent-prompt/agent-template.svelte';
	import AgentLink from './agent-prompt/agent-link.svelte';

    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {() => void} */
    export let handleAgentChange = () => {};

    export const fetchPromptWrapperData = () => {
        const templates = agentTemplateCmp?.fetchTemplates();
        const links = agentLinkCmp?.fetchLinks();

        return {
            templates: templates || [],
            links: links || []
        };
    };

    export const fetchOriginalPromptWrapperData = () => {
        const templates = agentTemplateCmp?.fetchOriginalTemplates();
        const links = agentLinkCmp?.fetchOriginalLinks();

        return {
            templates: templates || [],
            links: links || []
        };
    }

    export const refresh = () => {
        agentTemplateCmp?.refresh();
        agentLinkCmp?.refresh();
    }

    /** @type {any} */
    let agentTemplateCmp = null;
    /** @type {any} */
    let agentLinkCmp = null;

    /** @type {string}*/
    let selectedTab;

    /** @type {any[]}*/
    let tabs = [
        { name: 'agent-template', displayText: 'Templates' },
        { name: 'agent-link', displayText: 'Links' }
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

        <div class:hide={selectedTab !== 'agent-template'}>
            <AgentTemplate agent={agent} bind:this={agentTemplateCmp} {handleAgentChange} />
        </div>
        <div class:hide={selectedTab !== 'agent-link'}>
            <AgentLink agent={agent} bind:this={agentLinkCmp} {handleAgentChange} />
        </div>
    </CardBody>
</Card>