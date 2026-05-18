<script>
    import { slide } from 'svelte/transition';
    import Select from '$lib/common/dropdowns/Select.svelte';

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

    const toolOptions = $derived(
        (mcpOptions.find((/** @type {any} */ x) => x.id === mcp.server_id)?.tools || [])
            .filter((/** @type {string} */ t) => !!t)
            .map((/** @type {string} */ t) => ({ label: t, value: t }))
    );

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
        const values = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        onchange?.({
            mcpIdx: mcpIndex,
            field: 'mcp',
            value: values[0] || ''
        });
    }

    /**
     * @param {any} e
     * @param {number} fid
     * @param {string} type
     */
    function changeMcpItem(e, fid, type) {
        const values = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        onchange?.({
            mcpIdx: mcpIndex,
            field: type,
            itemIdx: fid,
            value: values[0] || ''
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

<div class="mti-wrapper">
    <div class="mti-row mti-row-primary">
        <div class="mti-label mti-label-strong">
            <div class="mti-cell">
                <i
                    class="bx bx-chevron-right mti-collapse-toggle"
                    class:rotated={!collapsed}
                    role="button"
                    tabindex="0"
                    onkeydown={() => {}}
                    onclick={() => toggleCollapse()}
                ></i>
            </div>
            <div class="mti-cell">
                {`MCP #${mcpIndex + 1}`}
            </div>
            <div class="mti-tooltip-wrap">
                <label class="mti-checkbox">
                    <input
                        type="checkbox"
                        class="mti-checkbox-input"
                        checked={!mcp.disabled}
                        onchange={e => toggleMcp(e)}
                    />
                    <span class="mti-checkbox-box"></span>
                </label>
            </div>
        </div>
        <div class="mti-value">
            <div class="mti-input-wrap mti-cell">
                <Select
                    tag={`mcp-server-${mcpIndex}`}
                    containerStyles={'width: 100%;'}
                    placeholder={'Select a server'}
                    disabled={mcp.disabled}
                    selectedValues={mcp.server_id ? [mcp.server_id] : []}
                    options={mcpOptions.filter(o => !!o.id).map(o => ({ label: o.displayName || o.name, value: o.id }))}
                    onselect={e => changeMcp(e)}
                />
            </div>
            <div class="mti-delete mti-cell">
                <i
                    class="bx bxs-no-entry mti-delete-icon"
                    role="link"
                    tabindex="0"
                    onkeydown={() => {}}
                    onclick={() => deleteMcp()}
                ></i>
            </div>
        </div>
    </div>

    {#if !collapsed}
    <div class="mti-row mti-row-secondary" transition:slide={{ duration: duration }}>
        <div class="mti-content">
            <div class="mti-list-item">
                <div class="mti-label mti-cell">
                    {'Server'}
                </div>
                <div class="mti-value">
                    <div class="mti-input-wrap mti-cell">
                        <input
                            type="text"
                            class="mti-input"
                            disabled
                            value={mcp.server_id}
                        />
                    </div>
                    <div class="mti-delete mti-cell"></div>
                </div>
            </div>
        </div>
        <div class="mti-content">
            {#each mcp.functions as fn, fid (fid)}
                <div class="mti-list-item">
                    <div class="mti-label mti-cell">
                        {fid === 0 ? 'Tools' : ''}
                    </div>
                    <div class="mti-value">
                        <div class="mti-input-wrap mti-cell">
                            <Select
                                tag={`mcp-fn-${mcpIndex}-${fid}`}
                                containerStyles={'width: 100%;'}
                                placeholder={'Select a tool'}
                                disabled={mcp.disabled}
                                selectedValues={fn.name ? [fn.name] : []}
                                options={toolOptions}
                                onselect={e => changeMcpItem(e, fid, 'function')}
                            />
                        </div>
                        <div class="mti-delete mti-cell">
                            <i
                                class="bx bxs-no-entry mti-delete-icon"
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
                <div class="mti-list-item">
                    <div class="mti-label">
                        {mcp.functions.length === 0 ? 'Functions' : ''}
                    </div>
                    <div class="mti-value">
                        <i
                            class="bx bx-list-plus mti-add-list"
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


