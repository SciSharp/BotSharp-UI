<script>
    import { onMount } from 'svelte';
    import Swal from 'sweetalert2';
    import { Card, CardBody, Button } from '@sveltestrap/sveltestrap';
    import { AI_PROGRAMMER_AGENT_ID, RULE_TRIGGER_CODE_GENERATE_TEMPLATE } from '$lib/helpers/constants';
    import { getAgentRuleOptions, generateAgentCodeScript, getAgentRuleActions, getAgentRuleCriteriaProviders } from '$lib/services/agent-service';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import { AgentCodeScriptType } from '$lib/helpers/enums';
	import { scrollToBottom } from '$lib/helpers/utils/common';
	import AgentRuleItem from './agent-rule-item.svelte';

    const limit = 100;
    
    /** @type {boolean} */
    let isLoading = false;
    /** @type {boolean} */
    let isComplete = false;
    /** @type {boolean} */
    let isError = false;
    /** @type {number} */
    let duration = 2000;
    let windowWidth = 0;
    let windowHeight = 0;

    /** @type {string} */
    let successText = '';
    let errorText = '';

    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {import('$userTypes').UserModel} */
    export let user;

    /** @type {() => void} */
    export let handleAgentChange = () => {};

    export const fetchRules = () => {
        const candidates = innerRules?.filter(x => !!x.trigger_name)?.map(x => {
            return {
                trigger_name: x.trigger_name,
                disabled: x.disabled,
                rule_criteria: x.rule_criteria,
                rule_action: x.rule_action,
                expanded: x.expanded
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

        innerRefresh(rules);
        return rules;
    }

    /** @type {any[]} */
    let ruleOptions = [];

    /** @type {any[]} */
    let criteriaOptions = [];

    /** @type {any[]} */
    let actionOptions = [];

    /** @type {import('$agentTypes').AgentRule[]} */
    let innerRules = [];

    /** @type {HTMLElement} */
    let scrollContainer;

    onMount(async () =>{
        resizeWindow();
        Promise.all([
            loadAgentRuleOptions(),
            loadAgentRuleCriteriaProviders(),
            loadAgentRuleActions()
        ]);
    });

    function loadAgentRuleOptions() {
        return new Promise((resolve, reject) => {
            getAgentRuleOptions().then(data => {
                const list = data?.map(x => {
                    return {
                        name: x.trigger_name,
                        displayName: "",
                        output_args: x.output_args,
                        json_args: x.json_args,
                        statement: x.statement
                    };
                }) || [];
                ruleOptions = [{
                    name: "",
                    displayName: ""
                }, ...list];
                init();
                resolve('done');
            });
        });
    }

    function init() {
        const list = agent.rules?.map(x => {
            return {
                ...x,
                displayName: ""
            };
        }) || [];
        innerRefresh(list);
    }

    function loadAgentRuleActions() {
        return new Promise((resolve, reject) => {
            getAgentRuleActions().then(data => {
                const list = data?.map(x => ({ name: x })) || [];
                actionOptions = [{
                    name: ""
                }, ...list];
                resolve('done');
            });
        });
    }

    function loadAgentRuleCriteriaProviders() {
        return new Promise((resolve, reject) => {
            getAgentRuleCriteriaProviders().then(data => {
                const list = data?.map(x => ({ name: x })) || [];
                criteriaOptions = [{
                    name: ""
                }, ...list];
                resolve('done');
            });
        });
    }
    
    /**
	 * @param {any} e
	 * @param {number} idx
     * @param {string} field
	 */
    function changeRule(e, idx, field) {
        const found = innerRules.find((_, index) => index === idx);
        if (!found) return;

        const value = e.detail.value;
        if (field === 'rule') {
            found.trigger_name = value;
        } else if (field === 'criteria') {
            found.rule_criteria = { 
                ...found.rule_criteria || {},
                name: value,
                disabled: found.rule_criteria?.disabled || false
            };
        } else if (field === 'action') {
            found.rule_action = {
                ...found.rule_action || {},
                name: value,
                disabled: found.rule_action?.disabled || false
            };
        }

        innerRefresh(innerRules);
        handleAgentChange();
    }

    function addRule() {
        innerRules = [
            ...innerRules,
            {
                trigger_name: '',
                displayName: '',
                disabled: false,
                expanded: true
            }
        ];
        scrollToBottom(scrollContainer);
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
     * @param {string} field
	 */
    function toggleRule(e, uid, field) {
        const found = innerRules.find((_, index) => index === uid);
        if (!found) return;

        if (field === 'rule') {
            found.disabled = !e.detail.checked;
        } else if (field === 'criteria') {
            if (!found.rule_criteria) {
                found.rule_criteria = {
                    name: '',
                    disabled: false
                };
            }
            found.rule_criteria.disabled = !e.detail.checked;
        } else if (field === 'action') {
            if (!found.rule_action) {
                found.rule_action = {
                    name: '',
                    disabled: false
                };
            }
            found.rule_action.disabled = !e.detail.checked;
        }
        
        innerRefresh(innerRules);
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} uid
     * @param {string} field
	 */
    function changeContent(e, uid, field) {
        const found = innerRules.find((_, index) => index === uid);
        if (!found) return;

        const value = e.detail.value;
        if (field === 'criteria-text') {
            if (found.rule_criteria == null) {
                found.rule_criteria = {
                    name: '',
                    disabled: false,
                    config: {}
                };
            }
            found.rule_criteria.criteria_text = value;
            innerRefresh(innerRules);
            handleAgentChange();
        } else if (field === 'criteria-config') {
            if (found.rule_criteria == null) {
                found.rule_criteria = {
                    name: '',
                    disabled: false,
                    config: {}
                };
            }
            try {
                found.rule_criteria.config = JSON.parse(value || '{}');
                handleAgentChange();
            } catch {
                // ignore invalid JSON while typing
            }
        } else if (field === 'action-config') {
            if (found.rule_action == null) {
                found.rule_action = {
                    name: '',
                    disabled: false,
                    config: {}
                };
            }
            try {
                found.rule_action.config = JSON.parse(value || '{}');
                handleAgentChange();
            } catch {
                // ignore invalid JSON while typing
            }
        }
    }

    /**
     * @param {any} e
	 * @param {number} uid
     * @param {boolean} collapsed
	 */
	function toggleCollapse(e, uid, collapsed) {
		const found = innerRules.find((_, index) => index === uid);
        if (!found) return;

        found.expanded = !collapsed;
        innerRefresh(innerRules);
        handleAgentChange();
	}

    /**
	 * @param {import("$agentTypes").AgentRule} rule
	 */
    function compileCodeScript(rule) {
        if (!!rule.rule_criteria?.disabled) {
            return;
        }

        Swal.fire({
            title: 'Are you sure?',
            html: `
                <div>
                    <p>Are you sure you want to generate code script <b>"${buildScriptName(rule.trigger_name)}"</b>?</p>
                    <p>This action will overwrite existing code script if any.</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
			cancelButtonText: 'No',
            confirmButtonText: 'Yes'
        }).then(async (result) => {
            if (result.value) {
                generateCodeScript(rule);
            }
        });
    }

    /**
	 * @param {import("$agentTypes").AgentRule} rule
	 */
    function generateCodeScript(rule) {
        return new Promise((resolve, reject) => {
            isLoading = true;
            generateAgentCodeScript(agent.id, {
                text: '',
                options: {
                    agent_id: AI_PROGRAMMER_AGENT_ID,
                    template_name: RULE_TRIGGER_CODE_GENERATE_TEMPLATE,
                    save_to_db: true,
                    script_name: buildScriptName(rule.trigger_name),
                    script_type: AgentCodeScriptType.Src,
                    data: {
                        'args_example': { ...rule.output_args },
                        'user_request': rule.rule_criteria?.criteria_text
                    }
                }
            }).then(res => {
                if (res?.success) {
                    isLoading = false;
                    isComplete = true;
                    successText = "Code script has been generated!";
                    setTimeout(() => {
                        isComplete = false;
                        successText = "";
                    }, duration);
                    resolve(res);
                }  else {
                    throw "error when generating code script.";
                }
            }).catch(() => {
                isLoading = false;
                isComplete = false;
                isError = true;
                errorText = "Failed to generate code script.";
                setTimeout(() => {
                    isError = false;
                    errorText = "";
                }, duration);
                reject();
            });
        });
    }


    /** @param {import('$agentTypes').AgentRule[]} list */
    function innerRefresh(list) {
        innerRules = list?.map(x => {
            const found = ruleOptions.find(y => y.name === x.trigger_name);
            return {
                ...x,
                output_args: found?.output_args,
                json_args: found?.json_args,
                statement: found?.statement
            }
        }) || [];
    }

    /** @param {string} name */
    function buildScriptName(name) {
        let scriptName = name?.trim();
        if (!name) {
            scriptName = 'unknown_rule.py';
        } else {
            scriptName = `${scriptName.replace(/\s+/g, "_")}_rule.py`;
        }
        
        return scriptName;
    }

    function resizeWindow() {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
    }
</script>

<svelte:window on:resize={() => resizeWindow()}/>

<LoadingToComplete
    {isLoading}
    {isComplete}
    {isError}
    {successText}
    {errorText}
/>

<Card>
    <CardBody>
        <div class="text-center">
            <h5 class="mt-1 mb-3">Triggers & Rules</h5>
            <h6 class="mt-1 mb-3">Wake-up your agent by rules</h6>
        </div>

        <div class="agent-utility-container" bind:this={scrollContainer}>
            {#each innerRules as rule, uid (uid)}
                <AgentRuleItem
                    rule={rule}
                    ruleIndex={uid}
                    collapsed={!rule.expanded}
                    user={user}
                    ruleOptions={ruleOptions}
                    criteriaOptions={criteriaOptions}
                    actionOptions={actionOptions}
                    windowWidth={windowWidth}
                    on:toggle={e => toggleRule(e, uid, e.detail.field)}
                    on:delete={() => deleteRule(uid)}
                    on:changeOption={e => changeRule(e, uid, e.detail.field)}
                    on:changeContent={e => changeContent(e, uid, e.detail.field)}
                    on:compile={e => compileCodeScript(e.detail.rule)}
                    on:collapse={e => toggleCollapse(e, uid, e.detail.collapsed)}
                />
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