<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, Input, Button } from '@sveltestrap/sveltestrap';
	import { getAgentRuleOptions } from '$lib/services/agent-service';
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';
	import { ADMIN_ROLES } from '$lib/helpers/constants';

    const limit = 100;
    const textLimit = 1024;

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
        getAgentRuleOptions().then(data => {
            const list = data?.map(x => {
                return {
                    name: x.trigger_name,
                    displayName: "",
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
        scrollToBottom();
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


    /** @param {import('$agentTypes').AgentRule[]} list */
    function innerRefresh(list) {
        innerRules = list?.map(x => {
            const found = ruleOptions.find(y => y.name === x.trigger_name);
            return {
                ...x,
                // json_args: found?.json_args
                json_args: `\`\`\`json\n${JSON.stringify({
                    test: 'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the mo',
                    name: 'The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Mal'
                }, null, 2)}\n\`\`\``
            }
        }) || [];
    }

    function scrollToBottom() {
        if (scrollContainer) {
            setTimeout(() => {
                scrollContainer.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }, 0);
        }
    }
</script>

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
                                    <div class="d-flex gap-1">
                                        <div class="line-align-center">
                                            {'Criteria'}
                                        </div>
                                        {#if ADMIN_ROLES.includes(user?.role || '') && !!rule.trigger_name}
                                        <div
                                            class="line-align-center clickable text-primary fs-4"
                                            data-bs-toggle="tooltip"
                                            data-bs-placement="top"
                                            title="Compile"
                                        >
                                            <i class="mdi mdi-file-code" />
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
                                                    class="bx bx-info-circle"
                                                    style="font-size: 15px;"
                                                    id={`rule-${uid}`}
                                                />
                                                <BotsharpTooltip
                                                    isOpen
                                                    containerClasses="agent-utility-desc"
                                                    style={`min-width: 100px;`}
                                                    target={`rule-${uid}`}
                                                    placement="right"
                                                    persist={false}
                                                >
                                                    <Markdown
                                                        rawText
                                                        scrollable
                                                        containerClasses={'markdown-div'}
                                                        containerStyles={`max-width: 500px; max-height: 100px;`}
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