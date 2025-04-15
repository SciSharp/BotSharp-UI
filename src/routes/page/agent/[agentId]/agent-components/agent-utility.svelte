<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, Input, Button } from '@sveltestrap/sveltestrap';
    import { getAgentUtilityOptions } from '$lib/services/agent-service';
	import { truncateByPrefix } from '$lib/helpers/utils/common';

    const limit = 5;
    const prefix = "util-";

    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {() => void} */
    export let handleAgentChange = () => {};

    export const fetchUtilities = () => {
        const candidates = innerUtilities?.filter(x => !!x.name)?.map(x => {
            /** @type {import('$commonTypes').NameBase[]} */
            const functions = [];
            /** @type {import('$commonTypes').NameBase[]} */
            const templates = [];

            const uniqueFns = new Set();
            const uniqueTps = new Set();
            const fns = x.functions.filter(f => !!f.name);
            const tps = x.templates.filter(t => !!t.name);

            fns.forEach(f => {
                if (!uniqueFns.has(f.name)) {
                    functions.push({ ...f });
                    uniqueFns.add(f.name);
                }
            });

            tps.forEach(t => {
                if (!uniqueTps.has(t.name)) {
                    templates.push({ ...t });
                    uniqueTps.add(t.name);
                }
            });

            return {
                name: x.name,
                disabled: x.disabled,
                functions: functions,
                templates: templates
            };
        });

        innerRefresh(candidates);
        return candidates;
    }

    export const fetchOriginalUtilities = () => {
        return innerUtilities;
    }

    export const refresh = () => init();

    /** @type {any} */
    let utilityMapper = {};

    /** @type {string[]} */
    let utilityOptions = [];

    /** @type {import('$agentTypes').AgentUtility[]} */
    let innerUtilities = [];

    onMount(async () =>{
        getAgentUtilityOptions().then(data => {
            const list = data || [];
            list.forEach(item => {
                const fns = item.functions.map(f => {
                    return {
                        name: f.name,
                        displayName: truncateByPrefix(f.name, prefix)
                    };
                });
                const tps = item.templates.map(t => {
                    return {
                        name: t.name,
                        displayName: truncateByPrefix(t.name, prefix)
                    };
                });

                if (!utilityMapper[item.name]) {
                    utilityMapper[item.name] = {
                        functions: [{
                            name: "",
                            displayName: ""
                        }, ...fns],
                        templates: [{
                            name: "",
                            displayName: ""
                        }, ...tps]
                    };
                } else {
                    const prevFns = utilityMapper[item.name].functions;
                    const prevTps = utilityMapper[item.name].templates;
                    utilityMapper[item.name].functions = [...prevFns, fns];
                    utilityMapper[item.name].templates = [...prevTps, tps];
                }
            });
            const names = list.map(x => x.name) || [];
            utilityOptions = ["", ...names];
        });
        init();
    });

    function init() {
        const list = agent.utilities?.map(x => {
            return {
                ...x,
                functions: x.functions?.map(f => ({
                    ...f,
                    displayName: truncateByPrefix(f.name, prefix)
                })) || [],
                templates: x.templates?.map(t => ({
                    ...t,
                    displayName: truncateByPrefix(t.name, prefix)
                })) || []
            };
        }) || [];
        innerRefresh(list);
    }

    /**
	 * @param {any} e
	 * @param {number} idx
	 */
    function changeUtility(e, idx) {
        const found = innerUtilities.find((_, index) => index === idx);
        if (!found) return;
        
        const name = e.target.value;
        found.name = name;
        found.functions = [
            // @ts-ignore
            ...utilityMapper[name].functions?.filter(x => !!x.name) || []
        ];
        found.templates = [
            // @ts-ignore
            ...utilityMapper[name].templates?.filter(x => !!x.name) || []
        ];
        innerRefresh(innerUtilities);
        handleAgentChange();
    }

    function addUtility() {
        innerUtilities = [
            ...innerUtilities,
            {
                name: '',
                disabled: false,
                functions: [],
                templates: []
            }
        ];
    }

    /** @param {number} idx */
    function deleteUtility(idx) {
        innerUtilities = innerUtilities.filter((_, index) => index !== idx);
        handleAgentChange();
    }

    /**
	 * @param {number} uid
	 * @param {string} type
	 */
    function addUtilityContent(uid, type) {
        const found = innerUtilities.find((_, index) => index === uid);
        if (!found || found.disabled) return;

        if (type === 'function') {
            found.functions.push({ name: '', displayName: '' });
        } else if (type === 'template') {
            found.templates.push({ name: '', displayName: '' });
        }

        innerRefresh(innerUtilities);
        handleAgentChange();
    }

    /**
	 * @param {number} uid
	 * @param {number} id
     * @param {string} type
	 */
    function deleteUtilityContent(uid, id, type) {
        const found = innerUtilities.find((_, index) => index === uid);
        if (!found || found.disabled) return;

        if (type === 'function') {
            const fns = found.functions?.filter((_, index) => index !== id) || [];
            found.functions = fns;
        } else if (type === 'template') {
            const tps = found.templates?.filter((_, index) => index !== id) || [];
            found.templates = tps;
        }
        
        innerRefresh(innerUtilities);
        handleAgentChange();
    }

    
    /**
     * @param {any} e
	 * @param {number} uid
     * @param {number} idx
     * @param {string} type
	 */
    function selectContent(e, uid, idx, type) {
        const found = innerUtilities.find((_, index) => index === uid);
        if (!found) return;

        const vals = e.target.value.split("#");
        if (type === 'function') {
            const fn = found.functions?.find((_, index) => index === idx);
            if (fn) {
                fn.name = vals[0];
                fn.displayName = vals[1];
            }
        } else if (type === 'template') {
            const tp = found.templates?.find((_, index) => index === idx);
            if (tp) {
                tp.name = vals[0];
                tp.displayName = vals[1];
            }
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
                name: x.name,
                disabled: x.disabled,
                functions: x.functions.map(f => ({ ...f })),
                templates: x.templates.map(t => ({ ...t }))
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
                                        on:change={e => { toggleUtility(e, uid); }}
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
                                    value={utility.name}
                                    disabled={utility.disabled}
                                    on:change={e => { changeUtility(e, uid); }}
                                >
                                    {#each utilityOptions as option}
                                        <option value={option} selected={option == utility.name}>{option}</option>
                                    {/each}
                                </Input>
                            </div>
                            <div class="utility-delete line-align-center">
                                <i
                                    class="bx bxs-no-entry text-danger clickable"
                                    role="link"
                                    tabindex="0"
                                    on:keydown={() => {}}
                                    on:click={() => { deleteUtility(uid); }}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div class="utility-row utility-row-secondary">
                        <div class="utility-content">
                            {#each utility.functions as fn, fid (fid)}
                                <div class="utility-list-item">
                                    <div class="utility-label line-align-center">
                                        {fid === 0 ? 'Functions' : ''}
                                    </div>
                                    <div class="utility-value">
                                        <div class="utility-input line-align-center">
                                            <Input
                                                type="select"
                                                disabled={utility.disabled}
                                                on:change={e => { selectContent(e, uid, fid, 'function'); }}
                                            >
                                                {#each (utilityMapper[utility.name]?.functions || []) as option}
                                                    <option value={`${option.name}#${option.displayName}`} selected={option.name == fn.name}>{option.displayName}</option>
                                                {/each}
                                            </Input>
                                        </div>
                                        <div class="utility-delete line-align-center">
                                            <i
                                                class="bx bxs-no-entry text-danger clickable"
                                                role="link"
                                                tabindex="0"
                                                on:keydown={() => {}}
                                                on:click={() => { deleteUtilityContent(uid, fid, 'function'); }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/each}

                            {#if utility.functions?.length < limit}
                                <div class="utility-list-item">
                                    <div class="utility-label">
                                        {utility.functions.length === 0 ? 'Functions' : ''}
                                    </div>
                                    <div class="utility-value">
                                        <i
                                            class="bx bx-list-plus add-list clickable"
                                            role="link"
                                            tabindex="0"
                                            on:keydown={() => {}}
                                            on:click={() => { addUtilityContent(uid, 'function'); }}
                                        />
                                    </div>
                                </div>
                            {/if}
                        </div>

                        <div class="utility-content">
                            {#each utility.templates as tp, tid (tid)}
                                <div class="utility-list-item">
                                    <div class="utility-label line-align-center">
                                        {tid === 0 ? 'Templates' : ''}
                                    </div>
                                    <div class="utility-value">
                                        <div class="utility-input line-align-center">
                                            <Input
                                                type="select"
                                                disabled={utility.disabled}
                                                on:change={e => { selectContent(e, uid, tid, 'template'); }}
                                            >
                                                {#each (utilityMapper[utility.name]?.templates || []) as option}
                                                    <option value={`${option.name}#${option.displayName}`} selected={option.name == tp.name}>
                                                        {option.displayName || option.name}
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
                                                on:click={() => { deleteUtilityContent(uid, tid, 'template'); }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/each}

                            {#if utility.templates?.length < limit}
                                <div class="utility-list-item">
                                    <div class="utility-label">
                                        {utility.templates.length === 0 ? 'Templates' : ''}
                                    </div>
                                    <div class="utility-value">
                                        <i
                                            class="bx bx-list-plus add-list clickable"
                                            role="link"
                                            tabindex="0"
                                            on:keydown={() => {}}
                                            on:click={() => { addUtilityContent(uid, 'template'); }}
                                        />
                                    </div>
                                </div>
                            {/if}
                        </div>
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