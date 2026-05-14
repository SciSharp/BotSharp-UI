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

<div class="amt-card">
    <div class="amt-card-body">
        <div class="amt-header">
            <h5 class="amt-title">MCP Tools</h5>
            <h6 class="amt-subtitle">Tools powered by MCP Servers</h6>
        </div>

        <div class="amt-list" bind:this={scrollContainer}>
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
                <div class="amt-add">
                    <button
                        type="button"
                        class="amt-add-btn"
                        onclick={() => addMcp()}
                    >
                        <i class="bx bx-plus"></i>
                        <span>Add MCP</span>
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .amt-card {
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.625rem;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 6px 16px -10px rgb(15 23 42 / 0.08);
    }
    .amt-card-body { padding: 1.25rem; }
    .amt-header { text-align: center; margin-bottom: 0.75rem; }
    .amt-title {
        margin: 0.25rem 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgb(55 65 81);
    }
    .amt-subtitle {
        margin: 0.25rem 0 0.75rem 0;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--color-muted);
    }
    .amt-list {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        max-height: 500px;
        overflow-y: auto;
        scrollbar-width: thin;
        padding: 0 0.625rem;
    }
    .amt-add { display: flex; justify-content: center; padding-top: 0.25rem; }
    .amt-add-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.4375rem 0.875rem;
        border: 1px solid var(--color-primary);
        border-radius: 0.375rem;
        background-color: var(--color-primary);
        color: rgb(255 255 255);
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.05s ease;
    }
    .amt-add-btn:hover {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }
    .amt-add-btn:active { transform: translateY(1px); }
    .amt-add-btn i { font-size: 1rem; line-height: 1; }

    @media (max-width: 1250px) {
        .amt-list { padding: 0 0.3125rem; }
    }
    :global(.dark) .amt-card {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .amt-title { color: rgb(229 231 235); }
</style>