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

<style>
    .ari-wrapper {
        border: 1px dotted var(--color-primary);
        border-radius: 0.375rem;
        padding: 0.625rem;
        background-color: color-mix(in srgb, var(--color-primary) 2%, transparent);
    }
    .ari-row { display: flex; }
    .ari-row-primary { display: flex; }
    .ari-cell { display: flex; align-items: center; }
    .ari-label {
        width: 30%;
        font-size: 0.9375rem;
        flex-wrap: wrap;
        color: rgb(55 65 81);
    }
    .ari-label-strong { font-weight: 700; display: flex; gap: 0.625rem; }
    .ari-tooltip-wrap { display: flex; gap: 0.3125rem; align-items: center; }
    .ari-value { width: 70%; display: flex; gap: 0.3125rem; }
    .ari-input-wrap { width: 95%; }
    .ari-delete { width: 5%; }
    .ari-collapse-toggle {
        cursor: pointer;
        font-size: 1rem;
        color: rgb(75 85 99);
        transition: transform 0.2s ease-in-out, color 0.15s ease;
    }
    .ari-collapse-toggle.rotated { transform: rotate(90deg); }
    .ari-collapse-toggle:hover { color: var(--color-primary); }
    .ari-info-icon {
        font-size: 1rem;
        color: var(--color-primary);
        cursor: help;
    }
    .ari-delete-icon {
        cursor: pointer;
        font-size: 1rem;
        color: var(--color-danger);
        transition: filter 0.15s ease;
    }
    .ari-delete-icon:hover { filter: brightness(1.1); }

    .ari-checkbox {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        cursor: pointer;
        margin: 0;
    }
    .ari-checkbox-input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
        margin: 0;
    }
    .ari-checkbox-box {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 1px solid rgb(209 213 219);
        border-radius: 0.25rem;
        background-color: rgb(255 255 255);
        transition: border-color 0.15s ease, background-color 0.15s ease;
    }
    .ari-checkbox-input:checked + .ari-checkbox-box {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m3 8 3 3 7-7'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 0.75rem;
    }
    .ari-checkbox-input:focus-visible + .ari-checkbox-box {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 25%, transparent);
    }

    /* Selects are rendered via the Select component, which owns its styles */

    @media (max-width: 1250px) {
        .ari-row-primary { flex-direction: column; }
        .ari-row .ari-label,
        .ari-row .ari-value { width: 100%; }
        .ari-row .ari-value { flex-direction: column; }
        .ari-row .ari-input-wrap,
        .ari-row .ari-delete { width: 100%; }
        .ari-row .ari-delete {
            display: flex;
            justify-content: flex-end;
            align-items: end;
            margin-top: 0.375rem;
        }
    }
    :global(.dark) .ari-wrapper {
        background-color: color-mix(in srgb, var(--color-primary) 6%, rgb(31 41 55));
    }
    :global(.dark) .ari-label { color: rgb(229 231 235); }
    :global(.dark) .ari-checkbox-box {
        background-color: rgb(17 24 39);
        border-color: rgb(75 85 99);
    }

</style>
