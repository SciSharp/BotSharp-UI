<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, Button } from '@sveltestrap/sveltestrap';
	import { getServerConfigs } from '$lib/services/mcp-service';
	import { scrollToBottom } from '$lib/helpers/utils/common';
	import AgentMcpToolItem from './agent-mcp-tool-item.svelte';
    
    const limit = 100;

    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {() => void} */
    export let handleAgentChange = () => {};

    export const fetchMcpTools = () => {
        const candidates = innerMcps?.filter(x => !!x.name)?.map(x => {
            /** @type {import('$commonTypes').NameBase[]} */
            const functions = [];

            const uniqueFns = new Set();
            const fns = x.functions.filter(f => !!f.name);

            fns.forEach(f => {
                if (!uniqueFns.has(f.name)) {
                    functions.push({ ...f });
                    uniqueFns.add(f.name);
                }
            });

           return {
                ...x,
                name: x.name,
                disabled: x.disabled,
                functions: functions,
           };
        });

        /** @type {import('$agentTypes').AgentMcpTool[]} */
        const mcps = [];
        const unique = new Set();
        candidates.forEach(x => {
            if (!unique.has(x.name)) {
                mcps.push(x);
                unique.add(x.name);
            }
        });

        innerRefresh(mcps);
        return mcps;
    }

    /** @type {any[]} */
    let mcpOptions = [];

    /** @type {import('$agentTypes').AgentMcpTool[]} */
    let innerMcps = [];

    /** @type {HTMLElement} */
    let scrollContainer;


    onMount(async () => {
        getServerConfigs().then(res => {
            const list = res?.map(x => {
                return {
                    id: x.id,
                    name: x.name,
                    tools: [
                        '',
                        ...x.tools
                    ]
                };
            }) || [];
            mcpOptions = [
                {
                    id: '',
                    name: '',
                    tools: ['']
                },
                ...list
            ];
        }).catch(() => {
            mcpOptions = [];
        });
        init();
    });

    function init() {
        const list = agent.mcp_tools?.map(x => {
            return {
                ...x,
                displayName: ""
            };
        }) || [];
        innerRefresh(list);
    }

    /** @param {import('$agentTypes').AgentMcpTool[]} list */
    function innerRefresh(list) {
        innerMcps = list?.map(x => {
            return {
                ...x,
                name: x.name,
                server_id: x.server_id,
                disabled: x.disabled,
                functions: x.functions?.map(x => ({ ...x })) || []
            }
        }) || [];
    }

    function addMcp() {
        innerMcps = [
            ...innerMcps,
            {
                name: '',
                server_id: '',
                disabled: false,
                functions: [],
                expanded: true
            }
        ];
        scrollToBottom(scrollContainer);
        handleAgentChange();
    }

    /**
     * @param {any} e
     * @param {number} idx
     */
    function deleteMcp(e, idx) {
        if (e.detail.field === 'mcp') {
            innerMcps = innerMcps.filter((_, index) => index !== idx);
        } else if (e.detail.field === 'function') {
            const found = innerMcps.find((_, index) => index === idx);
            if (!found) return;

            const fns = found.functions?.filter((_, index) => index !== e.detail.itemIdx) || [];
            found.functions = fns;
            innerRefresh(innerMcps);
        }
        
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} idx
	 */
    function toggleMcp(e, idx) {
        const found = innerMcps.find((_, index) => index === idx);
        if (!found) return;

        found.disabled = !e.detail.checked;
        innerRefresh(innerMcps);
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} idx
	 */
    function changeMcpContent(e, idx) {
        const found = innerMcps.find((_, index) => index === idx);
        if (!found) return;

        if (e.detail.field === 'mcp') {
            const name = mcpOptions.find(x => x.id == e.detail.value)?.name || '';
            found.name = name;
            found.server_id = e.detail.value;
            found.functions = [];
        } else if (e.detail.field === 'function') {
            const fn = found.functions.find((_, index) => index === e.detail.itemIdx);
            if (fn) {
                fn.name = e.detail.value;
            }
        }

        innerRefresh(innerMcps);
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} idx
	 */
     function addMcpContent(e, idx) {
        const found = innerMcps.find((_, index) => index === idx);
        if (!found) return;

        if (e.detail.field === 'function') {
            found.functions.push({ name: '' });
        }

        innerRefresh(innerMcps);
        handleAgentChange();
    }


    /**
     * @param {any} e
	 * @param {number} idx
	 */
	function toggleCollapse(e, idx) {
		const found = innerMcps.find((_, index) => index === idx);
        if (!found) return;

        found.expanded = !e.detail.collapsed;
        innerRefresh(innerMcps);
        handleAgentChange();
	}
</script>

<Card>
    <CardBody>
        <div class="text-center">
            <h5 class="mt-1 mb-3">MCP Tools</h5>
            <h6 class="mt-1 mb-3">Tools powered by MCP Servers</h6>
        </div>

        <div class="agent-utility-container" bind:this={scrollContainer}>
            {#each innerMcps as mcp, uid (uid)}
                <AgentMcpToolItem
                    mcp={mcp}
                    mcpIndex={uid}
                    collapsed={!mcp.expanded}
                    mcpOptions={mcpOptions}
                    on:toggle={e => toggleMcp(e, uid)}
                    on:delete={e => deleteMcp(e, uid)}
                    on:change={e => changeMcpContent(e, uid)}
                    on:add={e => addMcpContent(e, uid)}
                    on:collapse={e => toggleCollapse(e, uid)}
                />
            {/each}

            {#if innerMcps.length < limit}
                <div class="add-utility">
                    <Button color="primary" on:click={() => addMcp()}>
                        <span>
                            <i class="bx bx-plus" />
                            <span>Add MCP</span>
                        </span>
                    </Button>
                </div>
            {/if}
        </div>
    </CardBody>
</Card>