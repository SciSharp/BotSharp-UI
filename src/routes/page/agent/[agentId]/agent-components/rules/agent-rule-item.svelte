<script>
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';

    /**
     * @type {{
     *   rule: import('$agentTypes').AgentRule,
     *   ruleIndex: number,
     *   collapsed?: boolean,
     *   ruleOptions?: any[],
     *   windowWidth: number,
     *   ontoggle?: (data: { ruleIdx: number, field: string, checked: boolean }) => void,
     *   onchange?: (data: { ruleIdx: number, field: string, value: string }) => void,
     *   ondelete?: (data: { ruleIdx: number, field: string }) => void,
     *   oncollapse?: (data: { ruleIdx: number, collapsed: boolean }) => void
     * }}
     */
    let {
        rule,
        ruleIndex,
        collapsed = true,
        ruleOptions = [],
        windowWidth,
        ontoggle,
        onchange,
        ondelete,
        oncollapse
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
        const values = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        onchange?.({
            ruleIdx: ruleIndex,
            field: field,
            value: values[0] || ''
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
</script>

<div class="ari-wrapper">
    <div class="ari-row ari-row-primary">
        <div class="ari-label ari-label-strong">
            <div class="ari-cell">
                <i
                    class="bx bx-chevron-right ari-collapse-toggle"
                    class:rotated={!collapsed}
                    role="button"
                    tabindex="0"
                    onkeydown={() => {}}
                    onclick={() => toggleCollapse()}
                ></i>
            </div>
            <div class="ari-cell">
                {`Rule #${ruleIndex + 1}`}
            </div>
            <div class="ari-tooltip-wrap">
                <label class="ari-checkbox">
                    <input
                        type="checkbox"
                        class="ari-checkbox-input"
                        checked={!rule.disabled}
                        onchange={e => toggleRule(e, 'rule')}
                    />
                    <span class="ari-checkbox-box"></span>
                </label>
                {#if rule.statement}
                <div class="ari-cell">
                    <i
                        class="bx bx-info-circle ari-info-icon"
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
            </div>
        </div>
        <div class="ari-value">
            <div class="ari-input-wrap ari-cell">
                <Select
                    tag={`rule-trigger-${ruleIndex}`}
                    containerStyles={'width: 100%;'}
                    placeholder={'Select a trigger'}
                    disabled={rule.disabled}
                    selectedValues={rule.trigger_name ? [rule.trigger_name] : []}
                    options={ruleOptions.filter(o => !!o.name).map(o => ({ label: o.displayName || o.name, value: o.name }))}
                    onselect={e => changeRule(e, 'rule')}
                />
            </div>
            <div class="ari-delete ari-cell">
                <i
                    class="bx bxs-no-entry ari-delete-icon"
                    role="link"
                    tabindex="0"
                    onkeydown={() => {}}
                    onclick={() => deleteRule('rule')}
                ></i>
            </div>
        </div>
    </div>
</div>


