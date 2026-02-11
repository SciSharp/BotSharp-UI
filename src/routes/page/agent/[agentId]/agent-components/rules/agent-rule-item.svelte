<script>
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import { Input } from '@sveltestrap/sveltestrap';
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import CodeScript from '$lib/common/shared/CodeScript.svelte';
	import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';
	import { ADMIN_ROLES } from '$lib/helpers/constants';

    const svelteDispatch = createEventDispatcher();

    const duration = 200;
    const textLimit = 1024;

    /** @type {import('$agentTypes').AgentRule} */
    export let rule;

    /** @type {number} */
    export let ruleIndex;

    /** @type {boolean} */
    export let collapsed = true;

    /** @type {import('$userTypes').UserModel} */
    export let user;

    /** @type {any[]} */
    export let ruleOptions = [];

    /** @type {any[]} */
    export let criteriaOptions = [];

    /** @type {any[]} */
    export let actionOptions = [];

    /** @type {number} */
    export let windowWidth;



    /**
     * @param {any} e
     * @param {string} field
     */
    function toggleRule(e, field) {
        svelteDispatch('toggle', {
            ruleIdx: ruleIndex,
            field: field,
            checked: e.target.checked
        });
    }

    /**
     * @param {any} e
     * @param {string} field
     */
    function changeRule(e, field) {
        svelteDispatch('change', {
            ruleIdx: ruleIndex,
            field: field,
            value: e?.target?.value || e?.detail?.text || ''
        });
    }

    function deleteRule() {
        svelteDispatch('delete', {
            ruleIdx: ruleIndex
        });
    }


    function toggleCollapse() {
        svelteDispatch('collapse', {
            ruleIdx: ruleIndex,
            collapsed: !collapsed
        });
    }

    function compileCodeScript() {
        svelteDispatch('compile', {
            rule: rule
        });
    }
</script>

<div class="utility-wrapper">
    <div class="utility-row utility-row-primary">
        <div class="utility-label fw-bold">
            <div class="line-align-center">
                <i
                    class="bx bx-chevron-right clickable fs-6 collapse-toggle"
                    class:rotated={!collapsed}
                    role="button"
                    tabindex="0"
                    on:keydown={() => {}}
                    on:click={() => toggleCollapse()}
                />
            </div>
            <div class="line-align-center">
                {`Rule #${ruleIndex + 1}`}
            </div>
            <div class="utility-tooltip">
                <div class="line-align-center">
                    <Input
                        type="checkbox"
                        checked={!rule.disabled}
                        on:change={e => toggleRule(e, 'rule')}
                    />
                </div>
                {#if rule.statement}
                <div class="line-align-center">
                    <i
                        class="bx bx-info-circle text-primary fs-6"
                        style="padding-top: 2px;"
                        id={`rule-statement-${ruleIndex}`}
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Rule arguments"
                    />
                    <BotsharpTooltip
                        containerClasses="agent-utility-desc"
                        style={`min-width: ${Math.floor(windowWidth*0.3)}px;`}
                        target={`rule-statement-${ruleIndex}`}
                        placement="top"
                        persist
                    >
                        <Markdown
                            rawText
                            scrollable
                            containerClasses={'markdown-div'}
                            containerStyles={`max-width: ${Math.floor(windowWidth*0.3)}px;`}
                            text={rule.statement}
                        />
                    </BotsharpTooltip>
                </div>
                {/if}
            </div>
        </div>
        <div class="utility-value">
            <div class="utility-input line-align-center">
                <Input
                    type="select"
                    disabled={rule.disabled}
                    on:change={e => changeRule(e, 'rule')}
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
                    on:click={() => deleteRule()}
                />
            </div>
        </div>
    </div>

    {#if !collapsed}
    <div class="utility-row utility-row-secondary" transition:slide={{ duration: duration }}>
        <div class="utility-content">
            <div class="utility-list-item">
                <div class="utility-label line-align-center">
                    <div class="d-flex gap-1">
                        <div class="line-align-center">
                            {'Criteria'}
                        </div>
                        <div class="line-align-center">
                            <Input
                                type="checkbox"
                                checked={!rule.rule_criteria?.disabled}
                                on:change={e => toggleRule(e, 'criteria')}
                            />
                        </div>
                    </div>
                </div>
                <div class="utility-value">
                    <div class="utility-input line-align-center">
                        <Input
                            type="select"
                            disabled={!!rule.rule_criteria?.disabled}
                            on:change={e => changeRule(e, 'criteria')}
                        >
                            {#each [...criteriaOptions] as option}
                                <option value={option.name} selected={option.name == rule.rule_criteria?.name}>
                                    {option.name}
                                </option>
                            {/each}
                        </Input>
                    </div>
                    <div class="utility-delete line-align-center"></div>
                </div>
            </div>
            <div class="utility-list-item">
                <div class="utility-label line-align-center">
                    <div class="d-flex gap-1">
                        <div class="line-align-center">
                            {'Text'}
                        </div>
                        {#if ADMIN_ROLES.includes(user?.role || '') && !!rule.trigger_name && !!rule.rule_criteria?.criteria_text?.trim()}
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
                                on:click={() => compileCodeScript()}
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
                            disabled={!!rule.rule_criteria?.disabled}
                            maxlength={textLimit}
                            value={rule.rule_criteria?.criteria_text}
                            on:input={e => changeRule(e, 'criteria-text')}
                        />
                    </div>
                    <div class="utility-delete line-align-center">
                        {#if rule.json_args}
                        <div class="line-align-center">
                            <i
                                class="bx bxs-info-circle text-primary fs-5"
                                id={`rule-args-${ruleIndex}`}
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="Rule arguments"
                            />
                            <BotsharpTooltip
                                containerClasses="agent-utility-desc"
                                style={`min-width: ${Math.floor(windowWidth*0.3)}px;`}
                                target={`rule-args-${ruleIndex}`}
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
            {#if rule.rule_criteria?.name}
            <div class="utility-list-item">
                <div class="utility-label line-align-center">
                    <div class="d-flex gap-1">
                        <div class="line-align-center">
                            {'Config'}
                        </div>
                    </div>
                </div>
                <div class="utility-value">
                    <div class="utility-input line-align-center">
                        <CodeScript
                            language="json"
                            containerClasses="agent-rule-config"
                            hideLineNumber={true}
                            editable={!rule.rule_criteria?.disabled}
                            scriptText={JSON.stringify(rule.rule_criteria?.config || {}, null, 2)}
                            on:change={(e) => changeRule(e, 'criteria-config')}
                        />
                    </div>
                    <div class="utility-delete line-align-center"></div>
                </div>
            </div>
            {/if}
        </div>
    </div>

    <div class="utility-row utility-row-secondary" transition:slide={{ duration: duration }}>
        <div class="utility-content">
            <div class="utility-list-item">
                <div class="utility-label line-align-center">
                    <div class="d-flex gap-1">
                        <div class="line-align-center">
                            {'Action'}
                        </div>
                        <div class="line-align-center">
                            <Input
                                type="checkbox"
                                checked={!rule.rule_action?.disabled}
                                on:change={e => toggleRule(e, 'action')}
                            />
                        </div>
                    </div>
                </div>
                <div class="utility-value">
                    <div class="utility-input line-align-center">
                        <Input
                            type="select"
                            disabled={!!rule.rule_action?.disabled}
                            on:change={e => changeRule(e, 'action')}
                        >
                            {#each [...actionOptions] as option}
                                <option value={option.name} selected={option.name == rule.rule_action?.name}>
                                    {option.name}
                                </option>
                            {/each}
                        </Input>
                    </div>
                    <div class="utility-delete line-align-center"></div>
                </div>
            </div>
            {#if rule.rule_action?.name}
            <div class="utility-list-item">
                <div class="utility-label line-align-center">
                    <div class="d-flex gap-1">
                        <div class="line-align-center">
                            {'Config'}
                        </div>
                    </div>
                </div>
                <div class="utility-value">
                    <div class="utility-input line-align-center">
                        <CodeScript
                            language="json"
                            containerClasses="agent-rule-config"
                            hideLineNumber={true}
                            editable={!rule.rule_action?.disabled}
                            scriptText={JSON.stringify(rule.rule_action?.config || {}, null, 2)}
                            on:change={(e) => changeRule(e, 'action-config')}
                        />
                    </div>
                    <div class="utility-delete line-align-center"></div>
                </div>
            </div>
            {/if}
        </div>
    </div>
    {/if}
</div>