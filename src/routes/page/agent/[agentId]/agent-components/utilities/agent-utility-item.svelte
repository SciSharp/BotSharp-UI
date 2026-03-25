<script>
    import { slide } from 'svelte/transition';
	import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';
	import Markdown from '$lib/common/markdown/Markdown.svelte';

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
        onchange?.({
            utilityIdx: utilityIndex,
            field: 'utility-category',
            value: e.target.value
        });
    }

    /**
     * @param {any} e
	 */
    function changeUtilityName(e) {
        onchange?.({
            utilityIdx: utilityIndex,
            field: 'utility-name',
            value: e.target.value
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
                {`Utility #${utilityIndex + 1}`}
            </div>
            <div class="utility-tooltip">
                <div class="line-align-center">
                    <input
                        type="checkbox"
                        class="form-check-input"
                        checked={!utility.disabled}
                        onchange={e => toggleUtility(e)}
                    />
                </div>
            </div>
        </div>
        <div class="utility-value">
            <div class="utility-input line-align-center">
                <select
                    class="form-select"
                    disabled={utility.disabled}
                    onchange={e => changeUtilityCategory(e)}
                >
                    {#each utilityCategoryOptions as option}
                        <option value={option.value} selected={option.value == utility.category}>
                            {option.label}
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
                    onclick={() => deleteUtility()}
                ></i>
            </div>
        </div>
    </div>

    {#if !collapsed}
    <div class="utility-row utility-row-secondary" transition:slide={{ duration: duration }}>
        {#if utility.category}
            {@const utilityOptions = getUtilityOptions(utilityMapper[utility.category]?.map((/** @type {any} */ x) => x.name), 'Select a utility')}
            <div class="utility-content">
                <div class="utility-list-item">
                    <div class="utility-label d-flex" style="gap: 10px;">
                        <div class="line-align-center">{'Name'}</div>
                        {#if utility.name}
                        <div class="line-align-center">
                            <i
                                class="mdi mdi-refresh clickable fs-6"
                                style="padding-top: 3px;"
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
                    <div class="utility-value">
                        <div class="utility-input line-align-center">
                            <select
                                class="form-select"
                                disabled={utility.disabled}
                                onchange={e => changeUtilityName(e)}
                            >
                                {#each utilityOptions as option}
                                    <option value={option.value} selected={option.value == utility.name}>
                                        {option.label}
                                    </option>
                                {/each}
                            </select>
                        </div>
                        <div class="utility-delete line-align-center"></div>
                    </div>
                </div>
                <div class="utility-list-item">
                    <div class="utility-label line-align-center">
                        {'Visibility'}
                    </div>
                    <div class="utility-value">
                        <div class="utility-input line-align-center">
                            <input
                                type="text"
                                class="form-control"
                                disabled={utility.disabled}
                                maxlength={1000}
                                value={utility.visibility_expression}
                                onchange={e => changeUtilityVisibility(e)}
                            />
                        </div>
                        <div class="utility-delete line-align-center"></div>
                    </div>
                </div>
            </div>
        {/if}
        {#each utility.items as item, fid (fid)}
            <div class="utility-content">
                {#if item.function_name}
                    {@const description = getUtilityItemDescription(utility.category, utility.name, item.function_name)}
                    <div class="utility-list-item">
                        <div class="utility-label d-flex" style="gap: 10px;">
                            <div class="line-align-center">{'Function'}</div>
                            {#if description}
                            <div class="line-align-center">
                                <i
                                    class="bx bx-info-circle fs-6"
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
                        <div class="utility-value">
                            <div class="utility-input line-align-center">
                                <input
                                    type="text"
                                    class="form-control"
                                    value={item.function_display_name}
                                    disabled
                                />
                            </div>
                            <div class="utility-delete line-align-center">
                                <i
                                    class="bx bxs-no-entry text-danger clickable fs-6"
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
                    <div class="utility-list-item">
                        <div class="utility-label line-align-center">
                            {'Template'}
                        </div>
                        <div class="utility-value">
                            <div class="utility-input line-align-center">
                                <input
                                    type="text"
                                    class="form-control"
                                    value={item.template_display_name}
                                    disabled
                                />
                            </div>
                            <div class="utility-delete line-align-center">
                                <i
                                    class="bx bxs-no-entry text-danger clickable fs-6"
                                    role="link"
                                    tabindex="0"
                                    onkeydown={() => {}}
                                    onclick={() => deleteUtilityItem(fid, 'template')}
                                ></i>
                            </div>
                        </div>
                    </div>
                {/if}
                <div class="utility-list-item">
                    <div class="utility-label line-align-center">
                        {'Visibility'}
                    </div>
                    <div class="utility-value">
                        <div class="utility-input line-align-center">
                            <input
                                type="text"
                                class="form-control"
                                disabled={utility.disabled}
                                maxlength={1000}
                                value={item.visibility_expression}
                                onchange={e => changeUtilityItemVisibility(e, fid)}
                            />
                        </div>
                        <div class="utility-delete line-align-center"></div>
                    </div>
                </div>
            </div>
        {/each}
    </div>
    {/if}
</div>