<script>
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import { Input } from '@sveltestrap/sveltestrap';

    const svelteDispatch = createEventDispatcher();

    const duration = 200;
    const limit = 10;

    /** @type {import('$agentTypes').AgentMcpTool} */
    export let mcp;

    /** @type {number} */
    export let mcpIndex;

    /** @type {any[]} */
    export let mcpOptions;

    /** @type {boolean} */
    export let collapsed = true;

    /**
     * @param {any} e
	 */
    function toggleMcp(e) {
        svelteDispatch('toggle', {
            mcpIdx: mcpIndex,
            checked: e.target.checked
        });
    }

    function deleteMcp() {
        svelteDispatch('delete', {
            mcpIdx: mcpIndex,
            field: 'mcp'
        });
    }

    /**
     * @param {number} fid
     * @param {string} type
     */
    function deleteMcpItem(fid, type) {
        svelteDispatch('delete', {
            mcpIdx: mcpIndex,
            field: type,
            itemIdx: fid
        });
    }

    /**
     * @param {any} e
	 */
    function changeMcp(e) {
        svelteDispatch('change', {
            mcpIdx: mcpIndex,
            field: 'mcp',
            value: e.target.value
        });
    }

    /**
     * @param {any} e
	 * @param {number} fid
	 * @param {string} type
	 */
    function changeMcpItem(e, fid, type) {
        svelteDispatch('change', {
            mcpIdx: mcpIndex,
            field: type,
            itemIdx: fid,
            value: e.target.value
        });
    }

    /**
	 * @param {string} type
	 */
    function addMcpItem(type) {
        svelteDispatch('add', {
            mcpIdx: mcpIndex,
            field: type
        });
    }

    function toggleCollapse() {
        svelteDispatch('collapse', {
            mcpIdx: mcpIndex,
            collapsed: !collapsed
        });
    }
</script>

<div class="utility-wrapper">
    <div class="utility-row utility-row-primary">
        <div class="utility-label fw-bold">
            <div class="line-align-center">
                <i
                    class="bx bx-chevron-right clickable fs-6 collapse-toggle"
                    class:rotated={!collapsed}
                    role="button"
                    tabindex="0"
                    on:keydown={() => {}}
                    on:click={() => toggleCollapse()}
                />
            </div>
            <div class="line-align-center">
                {`MCP #${mcpIndex + 1}`}
            </div>
            <div class="utility-tooltip">
                <div class="line-align-center">
                    <Input
                        type="checkbox"
                        checked={!mcp.disabled}
                        on:change={e => toggleMcp(e)}
                    />
                </div>
                <!-- <div
                    class="line-align-center fs-6"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Uncheck to disable MCP"
                >
                    <i class="bx bx-info-circle" />
                </div> -->
            </div>
        </div>
        <div class="utility-value">
            <div class="utility-input line-align-center">
                <Input
                    type="select"
                    disabled={mcp.disabled}
                    on:change={e => changeMcp(e)}
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
                    class="bx bxs-no-entry text-danger clickable fs-6"
                    role="link"
                    tabindex="0"
                    on:keydown={() => {}}
                    on:click={() => deleteMcp()}
                />
            </div>
        </div>
    </div>

    {#if !collapsed}
    <div class="utility-row utility-row-secondary" transition:slide={{ duration: duration }}>
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
                                on:change={e => changeMcpItem(e, fid, 'function')}
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
                                class="bx bxs-no-entry text-danger clickable fs-6"
                                role="link"
                                tabindex="0"
                                on:keydown={() => {}}
                                on:click={() => deleteMcpItem(fid, 'function')}
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
                            class="bx bx-list-plus add-list clickable fs-6"
                            role="link"
                            tabindex="0"
                            on:keydown={() => {}}
                            on:click={() => addMcpItem('function')}
                        />
                    </div>
                </div>
            {/if}
        </div>
    </div>
    {/if}
</div>