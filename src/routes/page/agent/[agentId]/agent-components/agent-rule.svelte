<script>
    import { onMount } from 'svelte';
    import Swal from 'sweetalert2';
    import { Card, CardBody, Input, Button } from '@sveltestrap/sveltestrap';
	import { getAgentRuleOptions, generateAgentCodeScript } from '$lib/services/agent-service';
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
    import { ADMIN_ROLES, AI_PROGRAMMER_AGENT_ID, RULE_TRIGGER_CODE_GENERATE_TEMPLATE } from '$lib/helpers/constants';
	import { AgentCodeScriptType } from '$lib/helpers/enums';
	import { scrollToBottom } from '$lib/helpers/utils/common';

    const limit = 100;
    const textLimit = 1024;
    
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

        innerRefresh(rules);
        return rules;
    }

    /** @type {any[]} */
    let ruleOptions = [];

    /** @type {import('$agentTypes').AgentRule[]} */
    let innerRules = [];

    /** @type {HTMLElement} */
    let scrollContainer;

    onMount(async () =>{
        resizeWindow();
        getAgentRuleOptions().then(data => {
            const list = data?.map(x => {
                return {
                    name: x.trigger_name,
                    displayName: "",
                    output_args: x.output_args,
                    json_args: x.json_args
                };
            }) || [];
            ruleOptions = [{
                name: "",
                displayName: ""
            }, ...list];
            init();
        });
    });

    function init() {
        const list = agent.rules?.map(x => {
            return {
                ...x,
                displayName: ""
            };
        }) || [];
        innerRefresh(list);
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
        innerRefresh(innerRules);
        handleAgentChange();
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
	 */
    function toggleRule(e, uid) {
        const found = innerRules.find((_, index) => index === uid);
        if (!found) return;

        found.disabled = !e.target.checked;
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

        const val = e.target.value;
        if (field === 'criteria') {
            found.criteria = val;
        }
        innerRefresh(innerRules);
        handleAgentChange();
    }

    /**
	 * @param {import("$agentTypes").AgentRule} rule
	 */
    function compileCodeScript(rule) {
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
                        'user_request': rule.criteria
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
                json_args: found?.json_args
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

<LoadingToComplete {isLoading} {isComplete} {isError} {successText} {errorText} />

<Card>
    <CardBody>
        <div class="text-center">
            <h5 class="mt-1 mb-3">Triggers & Rules</h5>
            <h6 class="mt-1 mb-3">Wake-up your agent by rules</h6>
        </div>

        <div class="agent-utility-container" bind:this={scrollContainer}>
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
                                    class="line-align-center fs-6"
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
                                    class="bx bxs-no-entry text-danger clickable fs-6"
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
                                    <div class="d-flex gap-1">
                                        <div class="line-align-center">
                                            {'Criteria'}
                                        </div>
                                        {#if ADMIN_ROLES.includes(user?.role || '') && !!rule.trigger_name && !!rule.criteria?.trim()}
                                        <div
                                            class="line-align-center clickable text-primary fs-5"
                                            style="padding-top: 3px;"
                                            data-bs-toggle="tooltip"
                                            data-bs-placement="top"
                                            title="Compile code script"
                                        >
                                            <i
                                                class="mdi mdi-play-circle"
                                                role="link"
                                                tabindex="0"
                                                on:keydown={() => {}}
                                                on:click={() => compileCodeScript(rule)}
                                            />
                                        </div>
                                        {/if}
                                    </div>
                                </div>
                                <div class="utility-value">
                                    <div class="utility-input line-align-center">
                                        <Input
                                            type="textarea"
                                            style="resize: none;"
                                            rows={5}
                                            disabled={rule.disabled}
                                            maxlength={textLimit}
                                            value={rule.criteria}
                                            on:input={e => changeContent(e, uid, 'criteria')}
                                        />
                                    </div>
                                    <div class="utility-delete line-align-center">
                                        {#if rule.json_args}
                                            <div class="line-align-center">
                                                <i
                                                    class="bx bxs-info-circle text-primary fs-5"
                                                    id={`rule-${uid}`}
                                                    data-bs-toggle="tooltip"
                                                    data-bs-placement="top"
                                                    title="Rule arguments"
                                                />
                                                <BotsharpTooltip
                                                    containerClasses="agent-utility-desc"
                                                    style={`min-width: ${Math.floor(windowWidth*0.3)}px;`}
                                                    target={`rule-${uid}`}
                                                    placement="right"
                                                    persist
                                                >
                                                    <Markdown
                                                        rawText
                                                        scrollable
                                                        containerClasses={'markdown-div'}
                                                        containerStyles={`max-width: ${Math.floor(windowWidth*0.3)}px;`}
                                                        text={rule.json_args}
                                                    />
                                                </BotsharpTooltip>
                                            </div>
                                        {/if}
                                    </div>
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