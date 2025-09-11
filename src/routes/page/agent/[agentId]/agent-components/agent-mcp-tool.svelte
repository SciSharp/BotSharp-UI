<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, Input, Button } from '@sveltestrap/sveltestrap';
	import { getServerConfigs } from '$lib/services/mcp-service';
    
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
                name: x.name,
                server_id: x.server_id,
                disabled: x.disabled,
                functions: x.functions?.map(x => ({ ...x })) || []
            }
        }) || [];
    }

    /**
	 * @param {any} e
	 * @param {number} idx
	 */
     function changeMcp(e, idx) {
        const found = innerMcps.find((_, index) => index === idx);
        if (!found) return;
        
        const val = e.target.value;
        const name = mcpOptions.find(x => x.id == val)?.name || '';

        found.name = name;
        found.server_id = val;
        found.functions = [];
        innerRefresh(innerMcps);
        handleAgentChange();
    }

    function addMcp() {
        innerMcps = [
            ...innerMcps,
            {
                name: '',
                server_id: '',
                disabled: false,
                functions: []
            }
        ];
        scrollToBottom();
        handleAgentChange();
    }

    /** @param {number} idx */
    function deleteMcp(idx) {
        innerMcps = innerMcps.filter((_, index) => index !== idx);
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} uid
	 */
    function toggleMcp(e, uid) {
        const found = innerMcps.find((_, index) => index === uid);
        if (!found) return;

        found.disabled = !e.target.checked;
        innerRefresh(innerMcps);
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} id
     * @param {number} refId
     * @param {string} type
	 */
    function changeMcpContent(e, id, refId, type) {
        const found = innerMcps.find((_, index) => index === id);
        if (!found) return;

        const val = e.target.value;
        if (type === 'function') {
            const fn = found.functions.find((_, index) => index == refId);
            if (fn) {
                fn.name = val;
            }
        }
        innerRefresh(innerMcps);
        handleAgentChange();
    }

    /**
	 * @param {number} id
	 * @param {string} type
	 */
     function addMcpContent(id, type) {
        const found = innerMcps.find((_, index) => index === id);
        if (!found || found.disabled) return;

        if (type === 'function') {
            found.functions.push({ name: '' });
        }

        innerRefresh(innerMcps);
        handleAgentChange();
    }

    /**
	 * @param {number} uid
	 * @param {number} id
     * @param {string} type
	 */
     function deleteMcpContent(uid, id, type) {
        const found = innerMcps.find((_, index) => index === uid);
        if (!found || found.disabled) return;

        if (type === 'function') {
            const fns = found.functions?.filter((_, index) => index !== id) || [];
            found.functions = fns;
        }
        
        innerRefresh(innerMcps);
        handleAgentChange();
    }

    function scrollToBottom() {
        if (scrollContainer) {
            setTimeout(() => {
                scrollContainer.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }, 0);
        }
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
                <div class="utility-wrapper">
                    <div class="utility-row utility-row-primary">
                        <div class="utility-label fw-bold">
                            <div class="line-align-center">{`MCP #${uid + 1}`}</div>
                            <div class="utility-tooltip">
                                <div class="line-align-center">
                                    <Input
                                        type="checkbox"
                                        checked={!mcp.disabled}
                                        on:change={e => toggleMcp(e, uid)}
                                    />
                                </div>
                                <div
                                    class="line-align-center"
                                    data-bs-toggle="tooltip"
                                    data-bs-placement="top"
                                    title="Uncheck to disable MCP"
                                >
                                    <i class="bx bx-info-circle" />
                                </div>
                            </div>
                        </div>
                        <div class="utility-value">
                            <div class="utility-input line-align-center">
                                <Input
                                    type="select"
                                    disabled={mcp.disabled}
                                    on:change={e => changeMcp(e, uid)}
                                >
                                    {#each [...mcpOptions] as option}
                                        <option value={option.id} selected={option.id == mcp.server_id}>
                                            {option.displayName || option.name}
                                        </option>
                                    {/each}
                                </Input>
                            </div>
                            <div class="utility-delete line-align-center">
                                <i
                                    class="bx bxs-no-entry text-danger clickable"
                                    role="link"
                                    tabindex="0"
                                    on:keydown={() => {}}
                                    on:click={() => deleteMcp(uid)}
                                />
                            </div>
                        </div>
                    </div>

                    <div class="utility-row utility-row-secondary">
                        <div class="utility-content">
                            <div class="utility-list-item">
                                <div class="utility-label line-align-center">
                                    {'Server'}
                                </div>
                                <div class="utility-value">
                                    <div class="utility-input line-align-center">
                                        <Input
                                            type="text"
                                            disabled
                                            value={mcp.server_id}
                                        />
                                    </div>
                                    <div class="utility-delete line-align-center"></div>
                                </div>
                            </div>
                        </div>
                        <div class="utility-content">
                            {#each mcp.functions as fn, fid (fid)}
                                <div class="utility-list-item">
                                    <div class="utility-label line-align-center">
                                        {fid === 0 ? 'Tools' : ''}
                                    </div>
                                    <div class="utility-value">
                                        <div class="utility-input line-align-center">
                                            <Input
                                                type="select"
                                                disabled={mcp.disabled}
                                                on:change={e => changeMcpContent(e, uid, fid, 'function')}
                                            >
                                                {#each [...mcpOptions.find(x => x.id === mcp.server_id)?.tools || []] as option}
                                                    <option value={option} selected={option == fn.name}>
                                                        {option}
                                                    </option> 
                                                {/each}
                                            </Input>
                                        </div>
                                        <div class="utility-delete line-align-center">
                                            <i
                                                class="bx bxs-no-entry text-danger clickable"
                                                role="link"
                                                tabindex="0"
                                                on:keydown={() => {}}
                                                on:click={() => deleteMcpContent(uid, fid, 'function')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/each}

                            {#if mcp.functions?.length < limit}
                                <div class="utility-list-item">
                                    <div class="utility-label">
                                        {mcp.functions.length === 0 ? 'Functions' : ''}
                                    </div>
                                    <div class="utility-value">
                                        <i
                                            class="bx bx-list-plus add-list clickable"
                                            role="link"
                                            tabindex="0"
                                            on:keydown={() => {}}
                                            on:click={() => addMcpContent(uid, 'function')}
                                        />
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
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