<script>
    import { onMount } from 'svelte';
    import { getAgentUtilityOptions } from '$lib/services/agent-service';
	import { scrollToBottom, truncateByPrefix } from '$lib/helpers/utils/common';
	import AgentUtilityItem from './agent-utility-item.svelte';

    const limit = 100;
    const prefix = "util-";

    let windowWidth = $state(0);
    let windowHeight = $state(0);

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

    export const fetchUtilities = () => {
        const list = innerUtilities?.filter(x => !!x.category && !!x.name && x.items?.length > 0) || [];
        
        /** @type {import('$agentTypes').AgentUtility[]} */
        const candidates = list.reduce((acc, x) => {
            const tag = `${x.category}##${x.name}`;
            if (!acc.visited.has(tag)) {
                // @ts-ignore
                acc.result.push(x);
                acc.visited.add(tag);
            }
            return acc;
        }, { result: [], visited: new Set() }).result;

        innerRefresh(candidates);
        return candidates;
    }
    
    /** @type {any} */
    let utilityMapper = {};

    /** @type {import('$agentTypes').AgentUtility[]} */
    let innerUtilities = $state([]);

    /** @type {HTMLElement} */
    let scrollContainer;

    onMount(async () =>{
        resizeWindow();
        getAgentUtilityOptions().then(data => {
            const list = data || [];
            list.forEach(utility => {
                const content = {
                    name: utility.name,
                    items: utility.items.map(it => ({
                        ...it,
                        function_display_name: truncateByPrefix(it.function_name, prefix),
                        template_display_name: truncateByPrefix(it.template_name, prefix)
                    }))
                };

                const contents = utilityMapper[utility.category] || [];
                contents.push(content);
                utilityMapper[utility.category] = contents;
            });
            init();
        });
    });

    function init() {
        const list = agent.utilities?.map(x => {
            return {
                ...x,
                items: x.items.map(it => ({
                    ...it,
                    function_display_name: truncateByPrefix(it.function_name, prefix),
                    template_display_name: truncateByPrefix(it.template_name, prefix)
                }))
            };
        }) || [];
        innerRefresh(list);
    }

    function resizeWindow() {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
    }


    function addUtility() {
        innerUtilities = [
            ...innerUtilities,
            {
                category: '',
                name: '',
                disabled: false,
                items: [],
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
    function deleteUtility(data, idx) {
        if (data.field == 'utility') {
            innerUtilities = innerUtilities.filter((_, index) => index !== idx);
        } else if (data.field == 'utility-item') {
            const foundUtility = innerUtilities.find((_, index) => index === idx);
            const foundItem = foundUtility?.items?.find((_, index) => index === data.itemIdx);
            if (!foundUtility || !foundItem) return;

            if (data.subfield === 'function') {
                foundItem.function_name = null;
                foundItem.function_display_name = null;
                foundItem.template_name = null;
                foundItem.template_display_name = null;
            } else if (data.subfield === 'template') {
                foundItem.template_name = null;
                foundItem.template_display_name = null;
            }

            if (foundItem.function_name == null && foundItem.template_name == null) {
                foundUtility.items = foundUtility.items.filter((_, index) => index !== data.itemIdx);
            }

            innerRefresh(innerUtilities);
        }

        handleAgentChange();
    }


    /**
     * @param {any} data
	 * @param {number} idx
	 */
    function changeUtility(data, idx) {
        const found = innerUtilities.find((_, index) => index === idx);
        if (!found) return;

        if (data.field === 'utility-category') {
            const category = data.value;
            found.category = category;
            found.name = '';
            found.items = [];
        } else if (data.field === 'utility-name') {
            const name = data.value;
            found.name = name;
            const foundUtility = utilityMapper[found.category]?.find((/** @type {any} */ x) => x.name == name);
            found.items = foundUtility?.items?.map((/** @type {any} */ x) => ({...x})) || [];
        } else if (data.field === 'utility-visibility') {
            found.visibility_expression = data.value || null;
        } else if (data.field === 'utility-item-visibility') {
            const foundItem = found.items.find((_, index) => index === data.itemIdx);
            if (foundItem) {
                foundItem.visibility_expression = data.value || null;
            }
        }

        innerRefresh(innerUtilities);
        handleAgentChange();
    }

    /**
     * @param {any} data
	 * @param {number} idx
	 */
    function toggleUtility(data, idx) {
        const found = innerUtilities.find((_, index) => index === idx);
        if (!found) return;

        found.disabled = !data.checked;
        innerRefresh(innerUtilities);
        handleAgentChange();
    }


    /** @param {import('$agentTypes').AgentUtility[]} list */
    function innerRefresh(list) {
        innerUtilities = list?.map(x => {
            return {
                ...x,
                category: x.category,
                name: x.name,
                disabled: x.disabled,
                visibility_expression: x.visibility_expression,
                items: x.items.map(it => ({ ...it, description: null }))
            }
        }) || [];
    }


    /** @param {any} e */
    function toggleMergeUtility(e) {
        const checked = e.target.checked;
        if (agent) {
            agent.merge_utility = checked;
        }
        handleAgentChange();
    }

    /** @param {number} idx */
	function resetUtility(idx) {
		const found = innerUtilities.find((_, index) => index === idx);
        if (!found) return;

        const originalItems = utilityMapper[found.category]?.find((/** @type {any} */ x) => x.name === found.name)?.items || [];
        found.items = [...originalItems];
        innerRefresh(innerUtilities);
        handleAgentChange();
	}

    /**
     * @param {any} data
	 * @param {number} idx
	 */
	function toggleCollapse(data, idx) {
		const found = innerUtilities.find((_, index) => index === idx);
        if (!found) return;

        found.expanded = !data.collapsed;
        innerRefresh(innerUtilities);
        handleAgentChange();
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
</script>

<svelte:window onresize={() => resizeWindow()}/>

<div class="au-card">
    <div class="au-card-body">
        <div class="au-header">
            <h5 class="au-title">Utilities</h5>
            <h6 class="au-subtitle">Tools shared across plugins</h6>
        </div>

        <div class="au-list" bind:this={scrollContainer}>
            {#if !agent?.is_router}
                <label class="au-merge">
                    <span class="au-checkbox-wrap">
                        <input
                            type="checkbox"
                            class="au-checkbox-input"
                            checked={agent?.merge_utility || false}
                            onchange={e => toggleMergeUtility(e)}
                        />
                        <span class="au-checkbox-box"></span>
                    </span>
                    <span class="au-merge-label">Merge utilities</span>
                    <span
                        class="au-merge-info"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Merge with entry agent utilities"
                    >
                        <i class="bx bx-info-circle"></i>
                    </span>
                </label>
            {/if}

            {#each innerUtilities as utility, uid (uid)}
                {@const utilityCategoryOptions = getUtilityOptions(Object.keys(utilityMapper), 'Select a category')}
                <AgentUtilityItem
                    utility={utility}
                    utilityIndex={uid}
                    utilityMapper={utilityMapper}
                    utilityCategoryOptions={utilityCategoryOptions}
                    collapsed={!utility.expanded}
                    windowWidth={windowWidth}
                    ontoggle={data => toggleUtility(data, uid)}
                    ondelete={data => deleteUtility(data, uid)}
                    onreset={() => resetUtility(uid)}
                    onchange={data => changeUtility(data, uid)}
                    oncollapse={data => toggleCollapse(data, uid)}
                />
            {/each}

            {#if innerUtilities.length < limit}
                <div class="au-add">
                    <button
                        type="button"
                        class="au-add-btn"
                        onclick={() => addUtility()}
                    >
                        <i class="bx bx-plus"></i>
                        <span>Add utility</span>
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .au-card {
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.625rem;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 6px 16px -10px rgb(15 23 42 / 0.08);
    }
    .au-card-body {
        padding: 1.25rem;
    }
    .au-header {
        text-align: center;
        margin-bottom: 0.75rem;
    }
    .au-title {
        margin: 0.25rem 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgb(55 65 81);
    }
    .au-subtitle {
        margin: 0.25rem 0 0.75rem 0;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--color-muted);
    }
    .au-list {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        max-height: 500px;
        overflow-y: auto;
        scrollbar-width: thin;
        padding: 0 0.625rem;
    }

    /* ===== Merge utility row ===== */
    .au-merge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-weight: 700;
        font-size: 0.875rem;
        color: rgb(55 65 81);
        margin: 0;
    }
    .au-checkbox-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }
    .au-checkbox-input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
        margin: 0;
    }
    .au-checkbox-box {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 1px solid rgb(209 213 219);
        border-radius: 0.25rem;
        background-color: rgb(255 255 255);
        transition: border-color 0.15s ease, background-color 0.15s ease;
    }
    .au-checkbox-input:checked + .au-checkbox-box {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m3 8 3 3 7-7'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 0.75rem;
    }
    .au-checkbox-input:focus-visible + .au-checkbox-box {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 25%, transparent);
    }
    .au-merge-label {
        line-height: 1;
    }
    .au-merge-info {
        display: inline-flex;
        align-items: center;
        color: var(--color-muted);
        font-size: 1rem;
    }

    /* ===== Add button ===== */
    .au-add {
        display: flex;
        justify-content: center;
        padding-top: 0.25rem;
    }
    .au-add-btn {
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
    .au-add-btn:hover {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }
    .au-add-btn:active {
        transform: translateY(1px);
    }
    .au-add-btn i {
        font-size: 1rem;
        line-height: 1;
    }

    /* ===== Responsive ===== */
    @media (max-width: 1250px) {
        .au-list {
            padding: 0 0.3125rem;
        }
    }

    /* ===== Dark mode ===== */
    :global(.dark) .au-card {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .au-title,
    :global(.dark) .au-merge {
        color: rgb(229 231 235);
    }
    :global(.dark) .au-checkbox-box {
        background-color: rgb(17 24 39);
        border-color: rgb(75 85 99);
    }
</style>