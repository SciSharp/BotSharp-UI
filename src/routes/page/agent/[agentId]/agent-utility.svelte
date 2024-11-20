<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, Input, Button, Tooltip } from '@sveltestrap/sveltestrap';
    import { getAgentUtilities } from '$lib/services/agent-service';

    const limit = 5;
    const maxLength = 30;

    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    export const fetchUtilities = () => {
        const candidates = innerUtilities?.filter(x => !!x.name)?.map(x => {
            /** @type {import('$agentTypes').UtilityBase[]} */
            const functions = [];
            /** @type {import('$agentTypes').UtilityBase[]} */
            const templates = [];

            const uniqueFns = new Set();
            const uniqueTps = new Set();

            const fns = x.functions.filter(f => !!f.name?.trim()).map(f => ({ ...f, name: f.name.trim().toLowerCase() }));
            const tps = x.templates.filter(t => !!t.name?.trim()).map(t => ({ ...t, name: t.name.trim().toLowerCase() }));

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
                functions: functions,
                templates: templates
            };
        });

        refresh(candidates);
        return candidates;
    }


    /** @type {string[]} */
    let utilityOptions = [];

    /** @type {import('$agentTypes').AgentUtility[]} */
    let innerUtilities = [];

    onMount(async () =>{
        getAgentUtilities().then(data => {
            const list = data?.filter(x => x?.trim()?.length > 0) || [];
            utilityOptions = ["", ...list];
        });
        init();
    });

    function init() {
        refresh(agent.utilities);
    }

    /**
	 * @param {any} e
	 * @param {number} idx
	 */
    function changeUtility(e, idx) {
        const found = innerUtilities.find((_, index) => index === idx);
        if (!found) return;

        found.name = e.target.value;
    }

    function addUtility() {
        innerUtilities = [
            ...innerUtilities,
            {
                name: '',
                functions: [],
                templates: []
            }
        ];
    }

    /** @param {number} idx */
    function deleteUtility(idx) {
        innerUtilities = innerUtilities.filter((_, index) => index !== idx);
    }


    /** @param {number} uid */
    function addFunction(uid) {
        const found = innerUtilities.find((_, index) => index === uid);
        if (!found) return;

        found.functions.push({ name: '' });
        refresh(innerUtilities);
    }

    /**
	 * @param {number} uid
	 * @param {number} fid
	 */
    function deleteFunction(uid, fid) {
        const found = innerUtilities.find((_, index) => index === uid);
        if (!found) return;

        const fns = found.functions?.filter((_, index) => index !== fid) || [];
        found.functions = fns;
        refresh(innerUtilities);
    }


    /** @param {number} uid */
    function addTemplate(uid) {
        const found = innerUtilities.find((_, index) => index === uid);
        if (!found) return;

        found.templates.push({ name: '' });
        refresh(innerUtilities);
    }

    /**
	 * @param {number} uid
	 * @param {number} tid
	 */
    function deleteTemplate(uid, tid) {
        const found = innerUtilities.find((_, index) => index === uid);
        if (!found) return;

        const tps = found.templates?.filter((_, index) => index !== tid) || [];
        found.templates = tps;
        refresh(innerUtilities);
    }


    /** @param {import('$agentTypes').AgentUtility[]} list */
    function refresh(list) {
        innerUtilities = list?.map(x => {
            return {
                name: x.name,
                functions: x.functions.map(f => ({ ...f })),
                templates: x.templates.map(t => ({ ...t }))
            }
        }) || [];
    }


    /** @param {any} e */
    function changeMergeUtility(e) {
        const checked = e.target.checked;
        if (!!agent) {
            agent.merge_utility = checked;
        }
    }
</script>

<Card>
    <CardBody>
        <div class="text-center">
            <h5 class="mt-1 mb-3">Utilities</h5>
        </div>

        <div class="agent-utility-container">
            <div class="merge-utility">
                <Input
					type="checkbox"
					checked={agent?.merge_utility || false}
					on:change={e => changeMergeUtility(e)}
				/>
                <div class="fw-bold">
                    Merge utility
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

            {#each innerUtilities as utility, uid (uid)}
                <div class="utility-wrapper">
                    <div class="utility-row utility-row-primary">
                        <div class="utility-label line-align-center fw-bold">
                            {`Utility #${uid + 1}`}
                        </div>
                        <div class="utility-value">
                            <div class="utility-input line-align-center">
                                <Input type="select" value={utility.name} on:change={e => changeUtility(e, uid)}>
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
                                    on:click={() => deleteUtility(uid)}
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
                                            <Input bind:value={fn.name} maxlength={maxLength} />
                                        </div>
                                        <div class="utility-delete line-align-center">
                                            <i
                                                class="bx bxs-no-entry text-danger clickable"
                                                role="link"
                                                tabindex="0"
                                                on:keydown={() => {}}
                                                on:click={() => deleteFunction(uid, fid)}
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
                                            on:click={() => addFunction(uid)}
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
                                            <Input bind:value={tp.name} maxlength={maxLength} />
                                        </div>
                                        <div class="utility-delete line-align-center">
                                            <i
                                                class="bx bxs-no-entry text-danger clickable"
                                                role="link"
                                                tabindex="0"
                                                on:keydown={() => {}}
                                                on:click={() => deleteTemplate(uid, tid)}
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
                                            on:click={() => addTemplate(uid)}
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