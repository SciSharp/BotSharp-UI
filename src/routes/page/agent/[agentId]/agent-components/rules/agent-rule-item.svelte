<script>
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import { Input } from '@sveltestrap/sveltestrap';
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';
	import { ADMIN_ROLES } from '$lib/helpers/constants';

    const svelteDispatch = createEventDispatcher();

    const duration = 200;

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
    export let configOptions = [];

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

    /**
     * @param {string} field
     */
    function deleteRule(field) {
        svelteDispatch('delete', {
            ruleIdx: ruleIndex,
            field: field
        });
    }

    function toggleCollapse() {
        svelteDispatch('collapse', {
            ruleIdx: ruleIndex,
            collapsed: !collapsed
        });
    }

    function toggleConfig() {
        svelteDispatch('config', {
            ruleIdx: ruleIndex
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
                        title="Rule arguments"></i>
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

                {#if ADMIN_ROLES.includes(user?.role || '') && !!rule.trigger_name && rule.config?.topology_name}
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="line-align-center">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <i
                        class="bx bx-cog text-primary fs-6 clickable"
                        style="padding-top: 2px;"
                        id={`rule-config-${ruleIndex}`}
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Rule config"
                        on:click={() => toggleConfig()}
                    />
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
                    on:click={() => deleteRule('rule')}
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
                            {'Topology'}
                        </div>
                        <div class="line-align-center"></div>
                    </div>
                </div>
                <div class="utility-value">
                    <div class="utility-input line-align-center">
                        <Input
                            type="select"
                            on:change={e => changeRule(e, 'topology')}
                        >
                            {#each [...configOptions] as option}
                                <option value={`${option.name}`} selected={option.name == rule.config?.topology_name}>
                                    {option.name}
                                </option>
                            {/each}
                        </Input>
                    </div>
                    <div class="utility-delete line-align-center"></div>
                </div>
            </div>
        </div>
    </div>
    {/if}
</div>