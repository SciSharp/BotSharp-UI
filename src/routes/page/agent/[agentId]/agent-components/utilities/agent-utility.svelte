<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, Input, Button } from '@sveltestrap/sveltestrap';
    import { getAgentUtilityOptions } from '$lib/services/agent-service';
	import { scrollToBottom, truncateByPrefix } from '$lib/helpers/utils/common';
	import AgentUtilityItem from './agent-utility-item.svelte';

    const limit = 100;
    const prefix = "util-";

    let windowWidth = 0;
    let windowHeight = 0;

    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {() => void} */
    export let handleAgentChange = () => {};

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
    let innerUtilities = [];

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
     * @param {any} e
	 * @param {number} idx
	 */
    function deleteUtility(e, idx) {
        if (e.detail.field == 'utility') {
            innerUtilities = innerUtilities.filter((_, index) => index !== idx);
        } else if (e.detail.field == 'utility-item') {
            const foundUtility = innerUtilities.find((_, index) => index === idx);
            const foundItem = foundUtility?.items?.find((_, index) => index === e.detail.itemIdx);
            if (!foundUtility || !foundItem) return;

            if (e.detail.subfield === 'function') {
                foundItem.function_name = null;
                foundItem.function_display_name = null;
                foundItem.template_name = null;
                foundItem.template_display_name = null;
            } else if (e.detail.subfield === 'template') {
                foundItem.template_name = null;
                foundItem.template_display_name = null;
            }

            if (foundItem.function_name == null && foundItem.template_name == null) {
                foundUtility.items = foundUtility.items.filter((_, index) => index !== e.detail.itemIdx);
            }

            innerRefresh(innerUtilities);
        }

        handleAgentChange();
    }


    /**
     * @param {any} e
	 * @param {number} idx
	 */
    function changeUtility(e, idx) {
        const found = innerUtilities.find((_, index) => index === idx);
        if (!found) return;

        if (e.detail.field === 'utility-category') {
            const category = e.detail.value;
            found.category = category;
            found.name = '';
            found.items = [];
        } else if (e.detail.field === 'utility-name') {
            const name = e.detail.value;
            found.name = name;
            const foundUtility = utilityMapper[found.category]?.find((/** @type {any} */ x) => x.name == name);
            found.items = foundUtility?.items?.map((/** @type {any} */ x) => ({...x})) || [];
        } else if (e.detail.field === 'utility-visibility') {
            found.visibility_expression = e.detail.value || null;
        } else if (e.detail.field === 'utility-item-visibility') {
            const foundItem = found.items.find((_, index) => index === e.detail.itemIdx);
            if (foundItem) {
                foundItem.visibility_expression = e.detail.value || null;
            }
        }

        innerRefresh(innerUtilities);
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} idx
	 */
    function toggleUtility(e, idx) {
        const found = innerUtilities.find((_, index) => index === idx);
        if (!found) return;

        found.disabled = !e.detail.checked;
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
        if (!!agent) {
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
     * @param {any} e
	 * @param {number} idx
	 */
	function toggleCollapse(e, idx) {
		const found = innerUtilities.find((_, index) => index === idx);
        if (!found) return;

        found.expanded = !e.detail.collapsed;
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

<svelte:window on:resize={() => resizeWindow()}/>

<Card>
    <CardBody>
        <div class="text-center">
            <h5 class="mt-1 mb-3">Utilities</h5>
            <h6 class="mt-1 mb-3">Tools shared across plugins</h6>
        </div>

        <div class="agent-utility-container" bind:this={scrollContainer}>
            {#if !agent?.is_router}
                <div class="merge-utility">
                    <Input
                        type="checkbox"
                        checked={agent?.merge_utility || false}
                        on:change={e => toggleMergeUtility(e)}
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
                        <i class="bx bx-info-circle fs-6" />
                    </div>
                </div>
            {/if}

            {#each innerUtilities as utility, uid (uid)}
                {
                    @const utilityCategoryOptions = getUtilityOptions(Object.keys(utilityMapper), 'Select a category')
                }
                <AgentUtilityItem
                    utility={utility}
                    utilityIndex={uid}
                    utilityMapper={utilityMapper}
                    utilityCategoryOptions={utilityCategoryOptions}
                    collapsed={!utility.expanded}
                    windowWidth={windowWidth}
                    on:toggle={e => toggleUtility(e, uid)}
                    on:delete={e => deleteUtility(e, uid)}
                    on:reset={() => resetUtility(uid)}
                    on:change={e => changeUtility(e, uid)}
                    on:collapse={e => toggleCollapse(e, uid)}
                />
            {/each}

            {#if innerUtilities.length < limit}
                <div class="add-utility">
                    <Button color="primary" on:click={() => addUtility()}>
                        <span>
                            <i class="bx bx-plus" />
                            <span>Add utility</span>
                        </span>
                    </Button>
                </div>
            {/if}
        </div>
    </CardBody>
</Card>