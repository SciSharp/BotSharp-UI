<script>
    import { slide } from 'svelte/transition';

    const duration = 200;
    const limit = 10;

    /**
     * @type {{
     *   mcp: import('$agentTypes').AgentMcpTool,
     *   mcpIndex: number,
     *   mcpOptions?: any[],
     *   collapsed?: boolean,
     *   ontoggle?: (data: { mcpIdx: number, checked: boolean }) => void,
     *   ondelete?: (data: { mcpIdx: number, field: string, itemIdx?: number }) => void,
     *   onchange?: (data: { mcpIdx: number, field: string, value?: any, itemIdx?: number }) => void,
     *   onadd?: (data: { mcpIdx: number, field: string }) => void,
     *   oncollapse?: (data: { mcpIdx: number, collapsed: boolean }) => void
     * }}
     */
    let {
        mcp,
        mcpIndex,
        mcpOptions = [],
        collapsed = true,
        ontoggle,
        ondelete,
        onchange,
        onadd,
        oncollapse
    } = $props();

    /** @param {any} e */
    function toggleMcp(e) {
        ontoggle?.({
            mcpIdx: mcpIndex,
            checked: e.target.checked
        });
    }

    function deleteMcp() {
        ondelete?.({
            mcpIdx: mcpIndex,
            field: 'mcp'
        });
    }

    /**
     * @param {number} fid
     * @param {string} type
     */
    function deleteMcpItem(fid, type) {
        ondelete?.({
            mcpIdx: mcpIndex,
            field: type,
            itemIdx: fid
        });
    }

    /** @param {any} e */
    function changeMcp(e) {
        onchange?.({
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
        onchange?.({
            mcpIdx: mcpIndex,
            field: type,
            itemIdx: fid,
            value: e.target.value
        });
    }

    /** @param {string} type */
    function addMcpItem(type) {
        onadd?.({
            mcpIdx: mcpIndex,
            field: type
        });
    }

    function toggleCollapse() {
        oncollapse?.({
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
                    onkeydown={() => {}}
                    onclick={() => toggleCollapse()}
                ></i>
            </div>
            <div class="line-align-center">
                {`MCP #${mcpIndex + 1}`}
            </div>
            <div class="utility-tooltip">
                <div class="line-align-center">
                    <input
                        type="checkbox"
                        class="form-check-input"
                        checked={!mcp.disabled}
                        onchange={e => toggleMcp(e)}
                    />
                </div>
            </div>
        </div>
        <div class="utility-value">
            <div class="utility-input line-align-center">
                <select
                    class="form-select"
                    disabled={mcp.disabled}
                    onchange={e => changeMcp(e)}
                >
                    {#each [...mcpOptions] as option}
                        <option value={option.id} selected={option.id == mcp.server_id}>
                            {option.displayName || option.name}
                        </option>
                    {/each}
                </select>
            </div>
            <div class="utility-delete line-align-center">
                <i
                    class="bx bxs-no-entry text-danger clickable fs-6"
                    role="link"
                    tabindex="0"
                    onkeydown={() => {}}
                    onclick={() => deleteMcp()}
                ></i>
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
                        <input
                            type="text"
                            class="form-control"
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
                            <select
                                class="form-select"
                                disabled={mcp.disabled}
                                onchange={e => changeMcpItem(e, fid, 'function')}
                            >
                                {#each [...mcpOptions.find(x => x.id === mcp.server_id)?.tools || []] as option}
                                    <option value={option} selected={option == fn.name}>
                                        {option}
                                    </option>
                                {/each}
                            </select>
                        </div>
                        <div class="utility-delete line-align-center">
                            <i
                                class="bx bxs-no-entry text-danger clickable fs-6"
                                role="link"
                                tabindex="0"
                                onkeydown={() => {}}
                                onclick={() => deleteMcpItem(fid, 'function')}
                            ></i>
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
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Add function"
                            role="link"
                            tabindex="0"
                            onkeydown={() => {}}
                            onclick={() => addMcpItem('function')}
                        ></i>
                    </div>
                </div>
            {/if}
        </div>
    </div>
    {/if}
</div>