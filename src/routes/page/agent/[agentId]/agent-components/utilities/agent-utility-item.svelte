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


