<script>
    import { slide } from 'svelte/transition';
	import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';

    const duration = 200;

    /**
     * @type {{
     *   utility: import('$agentTypes').AgentUtility,
     *   utilityIndex: number,
     *   windowWidth: number,
     *   utilityMapper: any,
     *   utilityCategoryOptions: any[],
     *   collapsed?: boolean,
     *   ontoggle?: (data: { utilityIdx: number, checked: boolean }) => void,
     *   ondelete?: (data: { utilityIdx: number, field: string, subfield?: string, itemIdx?: number }) => void,
     *   onreset?: (data: { utilityIdx: number }) => void,
     *   onchange?: (data: { utilityIdx: number, field: string, value?: any, itemIdx?: number }) => void,
     *   oncollapse?: (data: { utilityIdx: number, collapsed: boolean }) => void
     * }}
     */
    let {
        utility,
        utilityIndex,
        windowWidth,
        utilityMapper,
        utilityCategoryOptions = [],
        collapsed = true,
        ontoggle,
        ondelete,
        onreset,
        onchange,
        oncollapse
    } = $props();


    /**
     * @param {any} e
	 */
    function toggleUtility(e) {
        ontoggle?.({
            utilityIdx: utilityIndex,
            checked: e.target.checked
        });
    }

    function deleteUtility() {
        ondelete?.({
            utilityIdx: utilityIndex,
            field: 'utility'
        });
    }

    function resetUtility() {
        onreset?.({
            utilityIdx: utilityIndex
        });
    }

    /**
     * @param {any} e
	 */
    function changeUtilityCategory(e) {
        const values = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        onchange?.({
            utilityIdx: utilityIndex,
            field: 'utility-category',
            value: values[0] || ''
        });
    }

    /**
     * @param {any} e
	 */
    function changeUtilityName(e) {
        const values = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        onchange?.({
            utilityIdx: utilityIndex,
            field: 'utility-name',
            value: values[0] || ''
        });
    }

    /**
     * @param {any} e
	 */
     function changeUtilityVisibility(e) {
        onchange?.({
            utilityIdx: utilityIndex,
            field: 'utility-visibility',
            value: e.target.value
        });
    }

    /**
     * @param {any} e
	 * @param {number} fid
	 */
    function changeUtilityItemVisibility(e, fid) {
        onchange?.({
            utilityIdx: utilityIndex,
            field: 'utility-item-visibility',
            itemIdx: fid,
            value: e.target.value
        });
    }

    /**
	 * @param {number} fid
     * @param {string} type
	 */
    function deleteUtilityItem(fid, type) {
        ondelete?.({
            utilityIdx: utilityIndex,
            field: 'utility-item',
            subfield: type,
            itemIdx: fid
        });
    }

    function toggleCollapse() {
        oncollapse?.({
            utilityIdx: utilityIndex,
            collapsed: !collapsed
        });
    }

    /**
     * @param {string[]} options
	 * @param {string} placeholder
	 */
    function getUtilityOptions(options, placeholder = '') {
        let list = options?.sort((a, b) => a.localeCompare(b))?.map(x => {
            return {
                label: x,
                value: x
            };
        }) || [];

        list = [{
            label: placeholder || '',
            value: ''
        }, ...list];
        return list;
    }

    /**
     * @param {string} category
     * @param {string} name
     * @param {string} key
	 */
    function getUtilityItemDescription(category, name, key) {
        // @ts-ignore
        const desc = utilityMapper[category]?.find(x => x.name === name)?.items?.find(x => x.function_name === key)?.description;
        return desc || '';
    }
</script>

<div class="aui-wrapper">
    <div class="aui-row aui-row-primary">
        <div class="aui-label aui-label-strong">
            <div class="aui-cell">
                <i
                    class="bx bx-chevron-right aui-collapse-toggle"
                    class:rotated={!collapsed}
                    role="button"
                    tabindex="0"
                    onkeydown={() => {}}
                    onclick={() => toggleCollapse()}
                ></i>
            </div>
            <div class="aui-cell">
                {`Utility #${utilityIndex + 1}`}
            </div>
            <div class="aui-tooltip-wrap">
                <label class="aui-checkbox">
                    <input
                        type="checkbox"
                        class="aui-checkbox-input"
                        checked={!utility.disabled}
                        onchange={e => toggleUtility(e)}
                    />
                    <span class="aui-checkbox-box"></span>
                </label>
            </div>
        </div>
        <div class="aui-value">
            <div class="aui-input-wrap aui-cell">
                <Select
                    tag={`utility-category-${utilityIndex}`}
                    containerStyles={'width: 100%;'}
                    placeholder={'Select a category'}
                    disabled={utility.disabled}
                    selectedValues={utility.category ? [utility.category] : []}
                    options={utilityCategoryOptions.filter(o => !!o.value)}
                    onselect={e => changeUtilityCategory(e)}
                />
            </div>
            <div class="aui-delete aui-cell">
                <i
                    class="bx bxs-no-entry aui-delete-icon"
                    role="link"
                    tabindex="0"
                    onkeydown={() => {}}
                    onclick={() => deleteUtility()}
                ></i>
            </div>
        </div>
    </div>

    {#if !collapsed}
    <div class="aui-row aui-row-secondary" transition:slide={{ duration: duration }}>
        {#if utility.category}
            {@const utilityOptions = getUtilityOptions(utilityMapper[utility.category]?.map((/** @type {any} */ x) => x.name), 'Select a utility')}
            <div class="aui-content">
                <div class="aui-list-item">
                    <div class="aui-label aui-label-flex">
                        <div class="aui-cell">{'Name'}</div>
                        {#if utility.name}
                        <div class="aui-cell">
                            <i
                                class="mdi mdi-refresh aui-refresh-icon"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="Reset"
                                role="button"
                                tabindex="0"
                                onkeydown={() => {}}
                                onclick={() => resetUtility()}
                            ></i>
                        </div>
                        {/if}
                    </div>
                    <div class="aui-value">
                        <div class="aui-input-wrap aui-cell">
                            <Select
                                tag={`utility-name-${utilityIndex}`}
                                containerStyles={'width: 100%;'}
                                placeholder={'Select a utility'}
                                disabled={utility.disabled}
                                selectedValues={utility.name ? [utility.name] : []}
                                options={utilityOptions.filter(o => !!o.value)}
                                onselect={e => changeUtilityName(e)}
                            />
                        </div>
                        <div class="aui-delete aui-cell"></div>
                    </div>
                </div>
                <div class="aui-list-item">
                    <div class="aui-label aui-cell">
                        {'Visibility'}
                    </div>
                    <div class="aui-value">
                        <div class="aui-input-wrap aui-cell">
                            <input
                                type="text"
                                class="aui-input"
                                disabled={utility.disabled}
                                maxlength={1000}
                                value={utility.visibility_expression}
                                onchange={e => changeUtilityVisibility(e)}
                            />
                        </div>
                        <div class="aui-delete aui-cell"></div>
                    </div>
                </div>
            </div>
        {/if}
        {#each utility.items as item, fid (fid)}
            <div class="aui-content">
                {#if item.function_name}
                    {@const description = getUtilityItemDescription(utility.category, utility.name, item.function_name)}
                    <div class="aui-list-item">
                        <div class="aui-label aui-label-flex">
                            <div class="aui-cell">{'Function'}</div>
                            {#if description}
                            <div class="aui-cell">
                                <i
                                    class="bx bx-info-circle aui-info-icon"
                                    id={`utility-${utilityIndex}-${fid}`}></i>
                                <BotsharpTooltip
                                    containerClasses="agent-utility-desc"
                                    style={`min-width: ${Math.floor(windowWidth*0.3)}px;`}
                                    target={`utility-${utilityIndex}-${fid}`}
                                    placement="right"
                                    persist
                                >
                                    <Markdown
                                        rawText
                                        scrollable
                                        containerClasses={'markdown-div'}
                                        containerStyles={`max-width: ${Math.floor(windowWidth*0.55)}px;`}
                                        text={description}
                                    />
                                </BotsharpTooltip>
                            </div>
                            {/if}
                        </div>
                        <div class="aui-value">
                            <div class="aui-input-wrap aui-cell">
                                <input
                                    type="text"
                                    class="aui-input"
                                    value={item.function_display_name}
                                    disabled
                                />
                            </div>
                            <div class="aui-delete aui-cell">
                                <i
                                    class="bx bxs-no-entry aui-delete-icon"
                                    role="link"
                                    tabindex="0"
                                    onkeydown={() => {}}
                                    onclick={() => deleteUtilityItem(fid, 'function')}
                                ></i>
                            </div>
                        </div>
                    </div>
                {/if}
                {#if item.template_name}
                    <div class="aui-list-item">
                        <div class="aui-label aui-cell">
                            {'Template'}
                        </div>
                        <div class="aui-value">
                            <div class="aui-input-wrap aui-cell">
                                <input
                                    type="text"
                                    class="aui-input"
                                    value={item.template_display_name}
                                    disabled
                                />
                            </div>
                            <div class="aui-delete aui-cell">
                                <i
                                    class="bx bxs-no-entry aui-delete-icon"
                                    role="link"
                                    tabindex="0"
                                    onkeydown={() => {}}
                                    onclick={() => deleteUtilityItem(fid, 'template')}
                                ></i>
                            </div>
                        </div>
                    </div>
                {/if}
                <div class="aui-list-item">
                    <div class="aui-label aui-cell">
                        {'Visibility'}
                    </div>
                    <div class="aui-value">
                        <div class="aui-input-wrap aui-cell">
                            <input
                                type="text"
                                class="aui-input"
                                disabled={utility.disabled}
                                maxlength={1000}
                                value={item.visibility_expression}
                                onchange={e => changeUtilityItemVisibility(e, fid)}
                            />
                        </div>
                        <div class="aui-delete aui-cell"></div>
                    </div>
                </div>
            </div>
        {/each}
    </div>
    {/if}
</div>

<style>
    /* ===== Wrapper ===== */
    .aui-wrapper {
        border: 1px dotted var(--color-primary);
        border-radius: 0.375rem;
        padding: 0.625rem;
        background-color: color-mix(in srgb, var(--color-primary) 2%, transparent);
    }

    /* ===== Rows ===== */
    .aui-row {
        display: flex;
    }
    .aui-row-primary {
        display: flex;
    }
    .aui-row-secondary {
        display: flex;
        flex-direction: column;
    }

    /* ===== Cell helper (was .line-align-center) ===== */
    .aui-cell {
        display: flex;
        align-items: center;
    }

    /* ===== Labels ===== */
    .aui-label {
        width: 30%;
        font-size: 0.9375rem;
        flex-wrap: wrap;
        color: rgb(55 65 81);
    }
    .aui-label-strong {
        font-weight: 700;
        display: flex;
        gap: 0.625rem;
    }
    .aui-label-flex {
        display: flex;
        gap: 0.625rem;
    }
    .aui-tooltip-wrap {
        display: flex;
        gap: 0.3125rem;
        align-items: center;
    }

    /* ===== Value column ===== */
    .aui-value {
        width: 70%;
        display: flex;
        gap: 0.3125rem;
    }
    .aui-input-wrap {
        width: 95%;
    }
    .aui-delete {
        width: 5%;
    }

    /* ===== Collapse chevron ===== */
    .aui-collapse-toggle {
        cursor: pointer;
        font-size: 1rem;
        color: rgb(75 85 99);
        transition: transform 0.2s ease-in-out, color 0.15s ease;
    }
    .aui-collapse-toggle.rotated {
        transform: rotate(90deg);
    }
    .aui-collapse-toggle:hover {
        color: var(--color-primary);
    }

    /* ===== Refresh / info / delete icons ===== */
    .aui-refresh-icon {
        cursor: pointer;
        font-size: 1rem;
        padding-top: 3px;
        color: var(--color-primary);
        transition: transform 0.15s ease;
    }
    .aui-refresh-icon:hover {
        transform: rotate(90deg);
    }
    .aui-info-icon {
        font-size: 1rem;
        color: var(--color-primary);
        cursor: help;
    }
    .aui-delete-icon {
        cursor: pointer;
        font-size: 1rem;
        color: var(--color-danger);
        transition: filter 0.15s ease;
    }
    .aui-delete-icon:hover {
        filter: brightness(1.1);
    }

    /* ===== Checkbox (was .form-check-input) ===== */
    .aui-checkbox {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        cursor: pointer;
        margin: 0;
    }
    .aui-checkbox-input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
        margin: 0;
    }
    .aui-checkbox-box {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 1px solid rgb(209 213 219);
        border-radius: 0.25rem;
        background-color: rgb(255 255 255);
        transition: border-color 0.15s ease, background-color 0.15s ease;
    }
    .aui-checkbox-input:checked + .aui-checkbox-box {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m3 8 3 3 7-7'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 0.75rem;
    }
    .aui-checkbox-input:focus-visible + .aui-checkbox-box {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 25%, transparent);
    }

    /* ===== Inputs (selects are rendered via the Select component) ===== */
    .aui-input {
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
    .aui-input:focus {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .aui-input:disabled {
        background-color: rgb(243 244 246);
        cursor: not-allowed;
        color: var(--color-muted);
    }

    /* ===== Content (list of items under expanded panel) =====
       No inner scroll: each block grows with its content so the
       Select dropdown can overflow outside this block freely. */
    .aui-content {
        display: flex;
        flex-direction: column;
        gap: 0.1875rem;
        border-top: 1px dotted var(--color-primary);
        margin-top: 0.625rem;
        padding-top: 0.625rem;
    }
    .aui-list-item {
        display: flex;
    }

    /* ===== Responsive ===== */
    @media (max-width: 1250px) {
        .aui-row-primary {
            flex-direction: column;
        }
        .aui-row .aui-label,
        .aui-row .aui-value {
            width: 100%;
        }
        .aui-row .aui-value {
            flex-direction: column;
        }
        .aui-row .aui-input-wrap,
        .aui-row .aui-delete {
            width: 100%;
        }
        .aui-row .aui-delete {
            display: flex;
            justify-content: flex-end;
            align-items: end;
            margin-top: 0.375rem;
        }
        .aui-row-secondary .aui-content .aui-list-item {
            flex-direction: column;
            gap: 0.375rem;
        }
    }

    /* ===== Dark mode ===== */
    :global(.dark) .aui-wrapper {
        background-color: color-mix(in srgb, var(--color-primary) 6%, rgb(31 41 55));
    }
    :global(.dark) .aui-label {
        color: rgb(229 231 235);
    }
    :global(.dark) .aui-checkbox-box {
        background-color: rgb(17 24 39);
        border-color: rgb(75 85 99);
    }
    :global(.dark) .aui-input {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .aui-input:disabled {
        background-color: rgb(31 41 55);
    }
</style>
