<script>
    import { onMount } from 'svelte';
	import { getServerConfigs } from '$lib/services/mcp-service';
	import { scrollToBottom } from '$lib/helpers/utils/common';
	import AgentMcpToolItem from './agent-mcp-tool-item.svelte';

    const limit = 100;

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
    let mcpOptions = $state([]);

    /** @type {import('$agentTypes').AgentMcpTool[]} */
    let innerMcps = $state([]);

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
     * @param {any} data
     * @param {number} idx
     */
    function deleteMcp(data, idx) {
        if (data.field === 'mcp') {
            innerMcps = innerMcps.filter((_, index) => index !== idx);
        } else if (data.field === 'function') {
            const found = innerMcps.find((_, index) => index === idx);
            if (!found) return;

            const fns = found.functions?.filter((_, index) => index !== data.itemIdx) || [];
            found.functions = fns;
            innerRefresh(innerMcps);
        }

        handleAgentChange();
    }

    /**
     * @param {any} data
     * @param {number} idx
     */
    function toggleMcp(data, idx) {
        const found = innerMcps.find((_, index) => index === idx);
        if (!found) return;

        found.disabled = !data.checked;
        innerRefresh(innerMcps);
        handleAgentChange();
    }

    /**
     * @param {any} data
     * @param {number} idx
     */
    function changeMcpContent(data, idx) {
        const found = innerMcps.find((_, index) => index === idx);
        if (!found) return;

        if (data.field === 'mcp') {
            const name = mcpOptions.find(x => x.id == data.value)?.name || '';
            found.name = name;
            found.server_id = data.value;
            found.functions = [];
        } else if (data.field === 'function') {
            const fn = found.functions.find((_, index) => index === data.itemIdx);
            if (fn) {
                fn.name = data.value;
            }
        }

        innerRefresh(innerMcps);
        handleAgentChange();
    }

    /**
     * @param {any} data
     * @param {number} idx
     */
    function addMcpContent(data, idx) {
        const found = innerMcps.find((_, index) => index === idx);
        if (!found || found.disabled) return;

        if (data.field === 'function') {
            found.functions.push({ name: '' });
        }

        innerRefresh(innerMcps);
        handleAgentChange();
    }

    /**
     * @param {any} data
     * @param {number} idx
     */
    function toggleCollapse(data, idx) {
        const found = innerMcps.find((_, index) => index === idx);
        if (!found) return;

        found.expanded = !data.collapsed;
        innerRefresh(innerMcps);
        handleAgentChange();
    }
</script>

<div class="card">
    <div class="card-body">
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
                    ontoggle={data => toggleMcp(data, uid)}
                    ondelete={data => deleteMcp(data, uid)}
                    onchange={data => changeMcpContent(data, uid)}
                    onadd={data => addMcpContent(data, uid)}
                    oncollapse={data => toggleCollapse(data, uid)}
                />
            {/each}

            {#if innerMcps.length < limit}
                <div class="add-utility">
                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick={() => addMcp()}
                    >
                        <span>
                            <i class="bx bx-plus"></i>
                            <span>Add MCP</span>
                        </span>
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>