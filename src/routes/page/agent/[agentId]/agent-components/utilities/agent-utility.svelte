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

<div class="card">
    <div class="card-body">
        <div class="text-center">
            <h5 class="mt-1 mb-3">Utilities</h5>
            <h6 class="mt-1 mb-3">Tools shared across plugins</h6>
        </div>

        <div class="agent-utility-container" bind:this={scrollContainer}>
            {#if !agent?.is_router}
                <div class="merge-utility">
                    <input
                        type="checkbox"
                        class="form-check-input"
                        checked={agent?.merge_utility || false}
                        onchange={e => toggleMergeUtility(e)}
                    />
                    <div class="fw-bold">
                        Merge utilities
                    </div>
                    <div
                        class="line-align-center"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Merge with entry agent utilities"
                    >
                        <i class="bx bx-info-circle fs-6"></i>
                    </div>
                </div>
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
                <div class="add-utility">
                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick={() => addUtility()}
                    >
                        <span>
                            <i class="bx bx-plus"></i>
                            <span>Add utility</span>
                        </span>
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>