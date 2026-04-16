<script>
    import { slide } from 'svelte/transition';
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';
	import { ADMIN_ROLES } from '$lib/helpers/constants';

    const duration = 200;

    /**
     * @type {{
     *   rule: import('$agentTypes').AgentRule,
     *   ruleIndex: number,
     *   collapsed?: boolean,
     *   user: import('$userTypes').UserModel,
     *   ruleOptions?: any[],
     *   configOptions?: any[],
     *   windowWidth: number,
     *   ontoggle?: (data: { ruleIdx: number, field: string, checked: boolean }) => void,
     *   onchange?: (data: { ruleIdx: number, field: string, value: string }) => void,
     *   ondelete?: (data: { ruleIdx: number, field: string }) => void,
     *   oncollapse?: (data: { ruleIdx: number, collapsed: boolean }) => void,
     *   onconfig?: (data: { ruleIdx: number }) => void
     * }}
     */
    let {
        rule,
        ruleIndex,
        collapsed = true,
        user,
        ruleOptions = [],
        configOptions = [],
        windowWidth,
        ontoggle,
        onchange,
        ondelete,
        oncollapse,
        onconfig
    } = $props();

    /**
     * @param {any} e
     * @param {string} field
     */
    function toggleRule(e, field) {
        ontoggle?.({
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
        onchange?.({
            ruleIdx: ruleIndex,
            field: field,
            value: e?.target?.value || ''
        });
    }

    /**
     * @param {string} field
     */
    function deleteRule(field) {
        ondelete?.({
            ruleIdx: ruleIndex,
            field: field
        });
    }

    function toggleCollapse() {
        oncollapse?.({
            ruleIdx: ruleIndex,
            collapsed: !collapsed
        });
    }

    function toggleConfig() {
        onconfig?.({
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
                    onkeydown={() => {}}
                    onclick={() => toggleCollapse()}
                ></i>
            </div>
            <div class="line-align-center">
                {`Rule #${ruleIndex + 1}`}
            </div>
            <div class="utility-tooltip">
                <div class="line-align-center">
                    <input
                        type="checkbox"
                        class="form-check-input"
                        style="margin-top: 0;"
                        checked={!rule.disabled}
                        onchange={e => toggleRule(e, 'rule')}
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
                    ></i>
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
                <div class="line-align-center">
                    <i
                        class="bx bx-cog text-primary fs-6 clickable"
                        style="padding-top: 2px;"
                        id={`rule-config-${ruleIndex}`}
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Rule config"
                        role="button"
                        tabindex="0"
                        onkeydown={() => {}}
                        onclick={() => toggleConfig()}
                    ></i>
                </div>
                {/if}
            </div>
        </div>
        <div class="utility-value">
            <div class="utility-input line-align-center">
                <select
                    class="form-select"
                    disabled={rule.disabled}
                    onchange={e => changeRule(e, 'rule')}
                >
                    {#each [...ruleOptions] as option}
                        <option value={option.name} selected={option.name == rule.trigger_name}>
                            {option.displayName || option.name}
                        </option>
                    {/each}
                </select>
            </div>
            <div class="utility-delete line-align-center">
                <i
                    class="bx bxs-no-entry text-danger clickable fs-6"
                    role="link"
                    tabindex="0"
                    onkeydown={() => {}}
                    onclick={() => deleteRule('rule')}
                ></i>
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
                        <select
                            class="form-select"
                            onchange={e => changeRule(e, 'topology')}
                        >
                            {#each [...configOptions] as option}
                                <option value={`${option.name}`} selected={option.name == rule.config?.topology_name}>
                                    {option.name}
                                </option>
                            {/each}
                        </select>
                    </div>
                    <div class="utility-delete line-align-center"></div>
                </div>
            </div>
        </div>
    </div>
    {/if}
</div>