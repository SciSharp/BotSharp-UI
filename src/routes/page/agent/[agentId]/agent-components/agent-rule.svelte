<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, Input, Button } from '@sveltestrap/sveltestrap';
	import { getAgentRuleOptions } from '$lib/services/agent-service';

    const limit = 5;
    const textLimit = 100;

    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {() => void} */
    export let handleAgentChange = () => {};

    export const fetchRules = () => {
        const candidates = innerRules?.filter(x => !!x.trigger_name)?.map(x => {
            return {
                trigger_name: x.trigger_name,
                disabled: x.disabled,
                criteria: x.criteria?.trim()
            };
        });

        /** @type {import('$agentTypes').AgentRule[]} */
        const rules = [];
        const unique = new Set();
        candidates.forEach(x => {
            if (!unique.has(x.trigger_name)) {
                rules.push(x);
                unique.add(x.trigger_name);
            }
        });

        refresh(rules);
        return rules;
    }

    export const fetchOriginalRules = () => {
        return innerRules;
    }

    export const reinit = () => init();

    /** @type {any[]} */
    let ruleOptions = [];

    /** @type {import('$agentTypes').AgentRule[]} */
    let innerRules = [];

    onMount(async () =>{
        getAgentRuleOptions().then(data => {
            const list = data?.map(x => {
                return {
                    name: x.trigger_name,
                    displayName: ""
                };
            }) || [];
            ruleOptions = [{
                name: "",
                displayName: ""
            }, ...list];
        });
        init();
    });

    function init() {
        const list = agent.rules?.map(x => {
            return {
                ...x,
                displayName: "",
            };
        }) || [];
        refresh(list);
    }
    
    /**
	 * @param {any} e
	 * @param {number} idx
	 */
    function changeRule(e, idx) {
        const found = innerRules.find((_, index) => index === idx);
        if (!found) return;
        
        const val = e.target.value;
        found.trigger_name = val;
        handleAgentChange();
        refresh(innerRules);
    }

    function addRule() {
        innerRules = [
            ...innerRules,
            {
                trigger_name: '',
                criteria: '',
                displayName: '',
                disabled: false
            }
        ];
        handleAgentChange();
    }

    /** @param {number} idx */
    function deleteRule(idx) {
        innerRules = innerRules.filter((_, index) => index !== idx);
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} uid
	 */
    function toggleRule(e, uid) {
        const found = innerRules.find((_, index) => index === uid);
        if (!found) return;

        found.disabled = !e.target.checked;
        handleAgentChange();
        refresh(innerRules);
    }

    /**
     * @param {any} e
	 * @param {number} uid
     * @param {string} field
	 */
    function changeContent(e, uid, field) {
        const found = innerRules.find((_, index) => index === uid);
        if (!found) return;

        const val = e.target.value;
        if (field === 'criteria') {
            found.criteria = val;
        }
        handleAgentChange();
        refresh(innerRules);
    }


    /** @param {import('$agentTypes').AgentRule[]} list */
    function refresh(list) {
        innerRules = list?.map(x => {
            return {
                trigger_name: x.trigger_name,
                criteria: x.criteria,
                displayName: x.displayName,
                disabled: x.disabled
            }
        }) || [];
    }

</script>

<Card>
    <CardBody>
        <div class="text-center">
            <h5 class="mt-1 mb-3">Rules</h5>
        </div>

        <div class="agent-utility-container">
            {#each innerRules as rule, uid (uid)}
                <div class="utility-wrapper">
                    <div class="utility-row utility-row-primary">
                        <div class="utility-label fw-bold">
                            <div class="line-align-center">{`Rule #${uid + 1}`}</div>
                            <div class="utility-tooltip">
                                <div class="line-align-center">
                                    <Input
                                        type="checkbox"
                                        checked={!rule.disabled}
                                        on:change={e => toggleRule(e, uid)}
                                    />
                                </div>
                                <div
                                    class="line-align-center"
                                    data-bs-toggle="tooltip"
                                    data-bs-placement="top"
                                    title="Uncheck to disable rule"
                                >
                                    <i class="bx bx-info-circle" />
                                </div>
                            </div>
                        </div>
                        <div class="utility-value">
                            <div class="utility-input line-align-center">
                                <Input
                                    type="select"
                                    disabled={rule.disabled}
                                    on:change={e => changeRule(e, uid)}
                                >
                                    {#each [...ruleOptions] as option}
                                        <option value={option.name} selected={option.name == rule.trigger_name}>
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
                                    on:click={() => deleteRule(uid)}
                                />
                            </div>
                        </div>
                    </div>

                    <div class="utility-row utility-row-secondary">
                        <div class="utility-content">
                            <div class="utility-list-item">
                                <div class="utility-label line-align-center">
                                    {'Criteria'}
                                </div>
                                <div class="utility-value">
                                    <div class="utility-input line-align-center">
                                        <Input
                                            type="text"
                                            disabled={rule.disabled}
                                            maxlength={textLimit}
                                            value={rule.criteria}
                                            on:input={e => changeContent(e, uid, 'criteria')}
                                        />
                                    </div>
                                    <div class="utility-delete line-align-center"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}

            {#if innerRules.length < limit}
                <div class="add-utility">
                    <Button color="primary" on:click={() => addRule()}>
                        <span>
                            <i class="bx bx-plus" />
                            <span>Add Rule</span>
                        </span>
                    </Button>
                </div>
            {/if}
        </div>
    </CardBody>
</Card>