<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, Input, Button } from '@sveltestrap/sveltestrap';
    import { getAgentUtilityOptions } from '$lib/services/agent-service';
	import { truncateByPrefix } from '$lib/helpers/utils/common';

    const limit = 100;
    const prefix = "util-";

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

    onMount(async () =>{
        init();
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

    /**
	 * @param {any} e
	 * @param {number} idx
	 */
    function changeUtilityCategory(e, idx) {
        const found = innerUtilities.find((_, index) => index === idx);
        if (!found) return;
        
        const category = e.target.value;
        found.category = category;
        found.name = '';
        found.items = [];
        innerRefresh(innerUtilities);
        handleAgentChange();
    }

    /**
	 * @param {any} e
	 * @param {number} idx
	 */
    function changeUtilityName(e, idx) {
        const found = innerUtilities.find((_, index) => index === idx);
        if (!found) return;
        
        const name = e.target.value;
        found.name = name;
        
        const foundUtility = utilityMapper[found.category]?.find((/** @type {any} */ x) => x.name == name);
        found.items = foundUtility?.items?.map((/** @type {any} */ x) => ({...x})) || [];

        innerRefresh(innerUtilities);
        handleAgentChange();
    }

    function addUtility() {
        innerUtilities = [
            ...innerUtilities,
            {
                category: '',
                name: '',
                disabled: false,
                items: []
            }
        ];
    }

    /** @param {number} idx */
    function deleteUtility(idx) {
        innerUtilities = innerUtilities.filter((_, index) => index !== idx);
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} uid
	 */
    function changeUtilityVisibility(e, uid) {
        const found = innerUtilities.find((_, index) => index === uid);
        if (!found) return;

        found.visibility_expression = e.target.value || null;
        innerRefresh(innerUtilities);
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} uid
     * @param {number} fid
	 */
    function changeUtilityItemVisibility(e, uid, fid) {
        const found = innerUtilities.find((_, index) => index === uid)?.items?.find((_, index) => index === fid);
        if (!found) return;

        found.visibility_expression = e.target.value || null;
        innerRefresh(innerUtilities);
        handleAgentChange();
    }

    /**
	 * @param {number} uid
	 * @param {number} fid
     * @param {string} type
	 */
    function deleteUtilityItem(uid, fid, type) {
        const foundUtility = innerUtilities.find((_, index) => index === uid);
        const foundItem = foundUtility?.items?.find((_, index) => index === fid);
        if (!foundUtility || !foundItem) return;

        if (type === 'function') {
            foundItem.function_name = null;
            foundItem.function_display_name = null;
        } else if (type === 'template') {
            foundItem.template_name = null;
            foundItem.template_display_name = null;
        }

        if (foundItem.function_name == null && foundItem.template_name == null) {
            foundUtility.items = foundUtility.items.filter((_, index) => index !== fid);
        }

        innerRefresh(innerUtilities);
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} uid
	 */
    function toggleUtility(e, uid) {
        const found = innerUtilities.find((_, index) => index === uid);
        if (!found) return;

        found.disabled = !e.target.checked;
        innerRefresh(innerUtilities);
        handleAgentChange();
    }


    /** @param {import('$agentTypes').AgentUtility[]} list */
    function innerRefresh(list) {
        innerUtilities = list?.map(x => {
            return {
                category: x.category,
                name: x.name,
                disabled: x.disabled,
                visibility_expression: x.visibility_expression,
                items: x.items.map(it => ({ ...it }))
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

    /** @param {number} uid */
	function resetUtility(uid) {
		const found = innerUtilities.find((_, index) => index === uid);
        if (!found) return;

        const originalItems = utilityMapper[found.category]?.find((/** @type {any} */ x) => x.name === found.name)?.items || [];
        found.items = [...originalItems];
        innerRefresh(innerUtilities);
        handleAgentChange();
	}
</script>

<Card>
    <CardBody>
        <div class="text-center">
            <h5 class="mt-1 mb-3">Utilities</h5>
            <h6 class="mt-1 mb-3">Tools shared across plugins</h6>
        </div>

        <div class="agent-utility-container">
            {#if !agent?.is_router}
                <div class="merge-utility">
                    <Input
                        type="checkbox"
                        checked={agent?.merge_utility || false}
                        on:change={e => { toggleMergeUtility(e);}}
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
                        <i class="bx bx-info-circle" />
                    </div>
                </div>
            {/if}

            {#each innerUtilities as utility, uid (uid)}
                <div class="utility-wrapper">
                    <div class="utility-row utility-row-primary">
                        <div class="utility-label fw-bold">
                            <div class="line-align-center">{`Utility #${uid + 1}`}</div>
                            <div class="utility-tooltip">
                                <div class="line-align-center">
                                    <Input
                                        type="checkbox"
                                        checked={!utility.disabled}
                                        on:change={e => toggleUtility(e, uid)}
                                    />
                                </div>
                                <div
                                    class="line-align-center"
                                    data-bs-toggle="tooltip"
                                    data-bs-placement="top"
                                    title="Uncheck to disable utility"
                                >
                                    <i class="bx bx-info-circle" />
                                </div>
                            </div>
                        </div>
                        <div class="utility-value">
                            <div class="utility-input line-align-center">
                                <Input
                                    type="select"
                                    value={utility.category}
                                    disabled={utility.disabled}
                                    on:change={e => changeUtilityCategory(e, uid)}
                                >
                                    {#each getUtilityOptions(Object.keys(utilityMapper), 'Select a category') as option}
                                        <option value={option.value} selected={option.value == utility.category}>
                                            {option.label}
                                        </option>
                                    {/each}
                                </Input>
                            </div>
                            <div class="utility-delete line-align-center">
                                <i
                                    class="bx bxs-no-entry text-danger clickable"
                                    role="link"
                                    tabindex="0"
                                    on:keydown={() => {}}
                                    on:click={() => deleteUtility(uid)}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div class="utility-row utility-row-secondary">
                        {#if utility.category}
                            <div class="utility-content">
                                <div class="utility-list-item">
                                    <div class="utility-label d-flex" style="gap: 10px;">
                                        <div class="line-align-center">{'Name'}</div>
                                        {#if utility.name}
                                        <div class="line-align-center">
                                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                                            <i
                                                class="mdi mdi-refresh clickable"
                                                data-bs-toggle="tooltip"
                                                data-bs-placement="top"
                                                title="Reset"
                                                on:click={() => resetUtility(uid)}
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
                                                on:change={e => changeUtilityName(e, uid)}
                                            >
                                                {#each getUtilityOptions(utilityMapper[utility.category]?.map((/** @type {any} */ x) => x.name), 'Select a utility') as option}
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
                                                on:change={e => changeUtilityVisibility(e, uid)}
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
                                    <div class="utility-list-item">
                                        <div class="utility-label line-align-center">
                                            {'Function'}
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
                                                    class="bx bxs-no-entry text-danger clickable"
                                                    role="link"
                                                    tabindex="0"
                                                    on:keydown={() => {}}
                                                    on:click={() => deleteUtilityItem(uid, fid, 'function')}
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
                                                    class="bx bxs-no-entry text-danger clickable"
                                                    role="link"
                                                    tabindex="0"
                                                    on:keydown={() => {}}
                                                    on:click={() => deleteUtilityItem(uid, fid, 'template')}
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
                                                on:change={e => changeUtilityItemVisibility(e, uid, fid)}
                                            />
                                        </div>
                                        <div class="utility-delete line-align-center"></div>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
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