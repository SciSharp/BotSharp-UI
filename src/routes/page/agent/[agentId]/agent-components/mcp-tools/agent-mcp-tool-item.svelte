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

<style>
    .mti-wrapper {
        border: 1px dotted var(--color-primary);
        border-radius: 0.375rem;
        padding: 0.625rem;
        background-color: color-mix(in srgb, var(--color-primary) 2%, transparent);
    }
    .mti-row { display: flex; }
    .mti-row-primary { display: flex; }
    .mti-row-secondary { display: flex; flex-direction: column; }
    .mti-cell { display: flex; align-items: center; }
    .mti-label {
        width: 30%;
        font-size: 0.9375rem;
        flex-wrap: wrap;
        color: rgb(55 65 81);
    }
    .mti-label-strong { font-weight: 700; display: flex; gap: 0.625rem; }
    .mti-tooltip-wrap { display: flex; gap: 0.3125rem; align-items: center; }
    .mti-value { width: 70%; display: flex; gap: 0.3125rem; }
    .mti-input-wrap { width: 95%; }
    .mti-delete { width: 5%; }
    .mti-collapse-toggle {
        cursor: pointer;
        font-size: 1rem;
        color: rgb(75 85 99);
        transition: transform 0.2s ease-in-out, color 0.15s ease;
    }
    .mti-collapse-toggle.rotated { transform: rotate(90deg); }
    .mti-collapse-toggle:hover { color: var(--color-primary); }
    .mti-delete-icon {
        cursor: pointer;
        font-size: 1rem;
        color: var(--color-danger);
        transition: filter 0.15s ease;
    }
    .mti-delete-icon:hover { filter: brightness(1.1); }
    .mti-add-list {
        cursor: pointer;
        font-size: 1.25rem;
        color: var(--color-primary);
        transition: transform 0.15s ease, color 0.15s ease;
    }
    .mti-add-list:hover {
        color: var(--color-primary-hover);
        transform: scale(1.1);
    }

    .mti-checkbox {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        cursor: pointer;
        margin: 0;
    }
    .mti-checkbox-input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
        margin: 0;
    }
    .mti-checkbox-box {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 1px solid rgb(209 213 219);
        border-radius: 0.25rem;
        background-color: rgb(255 255 255);
        transition: border-color 0.15s ease, background-color 0.15s ease;
    }
    .mti-checkbox-input:checked + .mti-checkbox-box {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m3 8 3 3 7-7'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 0.75rem;
    }
    .mti-checkbox-input:focus-visible + .mti-checkbox-box {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 25%, transparent);
    }

    /* Server/Tool selects are rendered via the Select component; only the
       disabled server_id readback text input still uses .mti-input here. */
    .mti-input {
        width: 100%;
        padding: 0.4375rem 0.625rem;
        font-size: 0.8125rem;
        line-height: 1.4;
        color: rgb(17 24 39);
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        font-family: inherit;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .mti-input:focus {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .mti-input:disabled {
        background-color: rgb(243 244 246);
        cursor: not-allowed;
        color: var(--color-muted);
    }

    .mti-content {
        display: flex;
        flex-direction: column;
        gap: 0.1875rem;
        border-top: 1px dotted var(--color-primary);
        margin-top: 0.625rem;
        padding-top: 0.625rem;
    }
    .mti-list-item { display: flex; }

    @media (max-width: 1250px) {
        .mti-row-primary { flex-direction: column; }
        .mti-row .mti-label,
        .mti-row .mti-value { width: 100%; }
        .mti-row .mti-value { flex-direction: column; }
        .mti-row .mti-input-wrap,
        .mti-row .mti-delete { width: 100%; }
        .mti-row .mti-delete {
            display: flex;
            justify-content: flex-end;
            align-items: end;
            margin-top: 0.375rem;
        }
        .mti-row-secondary .mti-content .mti-list-item {
            flex-direction: column;
            gap: 0.375rem;
        }
    }
    :global(.dark) .mti-wrapper {
        background-color: color-mix(in srgb, var(--color-primary) 6%, rgb(31 41 55));
    }
    :global(.dark) .mti-label { color: rgb(229 231 235); }
    :global(.dark) .mti-checkbox-box {
        background-color: rgb(17 24 39);
        border-color: rgb(75 85 99);
    }
    :global(.dark) .mti-input {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .mti-input:disabled { background-color: rgb(31 41 55); }
</style>
