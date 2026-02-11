<script>
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import { Input } from '@sveltestrap/sveltestrap';
	import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';
	import Markdown from '$lib/common/markdown/Markdown.svelte';

    const svelteDispatch = createEventDispatcher();

    const duration = 200;

    /** @type {import('$agentTypes').AgentUtility} */
    export let utility;

    /** @type {number} */
    export let utilityIndex;

    /** @type {number} */
    export let windowWidth;

    /** @type {any} */
    export let utilityMapper;

    /** @type {any[]} */
    export let utilityCategoryOptions;

    /** @type {boolean} */
    export let collapsed = true;


    /**
     * @param {any} e
	 */
    function toggleUtility(e) {
        svelteDispatch('toggle', {
            utilityIdx: utilityIndex,
            checked: e.target.checked
        });
    }

    function deleteUtility() {
        svelteDispatch('delete', {
            utilityIdx: utilityIndex,
            field: 'utility'
        });
    }

    function resetUtility() {
        svelteDispatch('reset', {
            utilityIdx: utilityIndex
        });
    }

    /**
     * @param {any} e
	 */
    function changeUtilityCategory(e) {
        svelteDispatch('change', {
            utilityIdx: utilityIndex,
            field: 'utility-category',
            value: e.target.value
        });
    }

    /**
     * @param {any} e
	 */
    function changeUtilityName(e) {
        svelteDispatch('change', {
            utilityIdx: utilityIndex,
            field: 'utility-name',
            value: e.target.value
        });
    }

    /**
     * @param {any} e
	 */
     function changeUtilityVisibility(e) {
        svelteDispatch('change', {
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
        svelteDispatch('change', {
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
        svelteDispatch('delete', {
            utilityIdx: utilityIndex,
            field: 'utility-item',
            subfield: type,
            itemIdx: fid
        });
    }

    function toggleCollapse() {
        svelteDispatch('collapse', {
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
                    on:keydown={() => {}}
                    on:click={() => toggleCollapse()}
                />
            </div>
            <div class="line-align-center">
                {`Utility #${utilityIndex + 1}`}
            </div>
            <div class="utility-tooltip">
                <div class="line-align-center">
                    <Input
                        type="checkbox"
                        checked={!utility.disabled}
                        on:change={e => toggleUtility(e)}
                    />
                </div>
                <!-- <div
                    class="line-align-center"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Uncheck to disable utility"
                >
                    <i class="bx bx-info-circle fs-6" />
                </div> -->
            </div>
        </div>
        <div class="utility-value">
            <div class="utility-input line-align-center">
                <Input
                    type="select"
                    value={utility.category}
                    disabled={utility.disabled}
                    on:change={e => changeUtilityCategory(e)}
                >
                    {#each utilityCategoryOptions as option}
                        <option value={option.value} selected={option.value == utility.category}>
                            {option.label}
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
                    on:click={() => deleteUtility()}
                />
            </div>
        </div>
    </div>
    
    {#if !collapsed}
    <div class="utility-row utility-row-secondary" transition:slide={{ duration: duration }}>
        {#if utility.category}
            {
                @const utilityOptions = getUtilityOptions(utilityMapper[utility.category]?.map((/** @type {any} */ x) => x.name), 'Select a utility')
            }
            <div class="utility-content">
                <div class="utility-list-item">
                    <div class="utility-label d-flex" style="gap: 10px;">
                        <div class="line-align-center">{'Name'}</div>
                        {#if utility.name}
                        <div class="line-align-center">
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <i
                                class="mdi mdi-refresh clickable fs-6"
                                style="padding-top: 3px;"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="Reset"
                                on:click={() => resetUtility()}
                            />
                        </div>
                        {/if}
                    </div>
                    <div class="utility-value">
                        <div class="utility-input line-align-center">
                            <Input
                                type="select"
                                value={utility.name}
                                disabled={utility.disabled}
                                on:change={e => changeUtilityName(e)}
                            >
                                {#each utilityOptions as option}
                                    <option value={option.value} selected={option.value == utility.name}>
                                        {option.label}
                                    </option>
                                {/each}
                            </Input>
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
                            <Input
                                type="text"
                                disabled={utility.disabled}
                                maxlength={1000}
                                value={utility.visibility_expression}
                                on:change={e => changeUtilityVisibility(e)}
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
                    { 
                        @const description = getUtilityItemDescription(utility.category, utility.name, item.function_name)
                    }
                    <div class="utility-list-item">
                        <div class="utility-label d-flex" style="gap: 10px;">
                            <div class="line-align-center">{'Function'}</div>
                            {#if description}
                            <div class="line-align-center">
                                <i
                                    class="bx bx-info-circle fs-6"
                                    id={`utility-${utilityIndex}-${fid}`}
                                />
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
                                <Input
                                    type="text"
                                    value={item.function_display_name}
                                    disabled
                                />
                            </div>
                            <div class="utility-delete line-align-center">
                                <i
                                    class="bx bxs-no-entry text-danger clickable fs-6"
                                    role="link"
                                    tabindex="0"
                                    on:keydown={() => {}}
                                    on:click={() => deleteUtilityItem(fid, 'function')}
                                />
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
                                <Input
                                    type="text"
                                    value={item.template_display_name}
                                    disabled
                                />
                            </div>
                            <div class="utility-delete line-align-center">
                                <i
                                    class="bx bxs-no-entry text-danger clickable fs-6"
                                    role="link"
                                    tabindex="0"
                                    on:keydown={() => {}}
                                    on:click={() => deleteUtilityItem(fid, 'template')}
                                />
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
                            <Input
                                type="text"
                                disabled={utility.disabled}
                                maxlength={1000}
                                value={item.visibility_expression}
                                on:change={e => changeUtilityItemVisibility(e, fid)}
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