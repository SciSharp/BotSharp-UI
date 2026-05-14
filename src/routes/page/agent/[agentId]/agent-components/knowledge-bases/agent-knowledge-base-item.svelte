<script>
    import { slide } from 'svelte/transition';
	import { DECIMAL_REGEX } from "$lib/helpers/constants";
	import Select from '$lib/common/dropdowns/Select.svelte';

    const duration = 200;

    /**
     * @type {{
     *   knowledge: import('$agentTypes').AgentKnowledgeBase,
     *   knwoledgeIdx: number,
     *   knowledgeBaseOptions?: any[],
     *   collapsed?: boolean,
     *   ontoggle?: (data: { knowledgeIdx: number, checked: boolean }) => void,
     *   ondelete?: (data: { knowledgeIdx: number }) => void,
     *   onchange?: (data: { knowledgeIdx: number, field: string, value: any }) => void,
     *   oncollapse?: (data: { knowledgeIdx: number, collapsed: boolean }) => void
     * }}
     */
    let {
        knowledge,
        knwoledgeIdx,
        knowledgeBaseOptions = [],
        collapsed = true,
        ontoggle,
        ondelete,
        onchange,
        oncollapse
    } = $props();

    const kbOptions = $derived(
        knowledgeBaseOptions
            .filter((/** @type {any} */ o) => !!o.name)
            .map((/** @type {any} */ o) => ({ label: o.displayName || o.name, value: JSON.stringify(o) }))
    );
    const selectedKb = $derived(
        knowledgeBaseOptions.find((/** @type {any} */ o) => o.name === knowledge.name)
    );

    /** @param {any} e */
    function validateConfidenceInput(e) {
        const reg = new RegExp(DECIMAL_REGEX, 'g');
        if (e.key !== 'Backspace' && !reg.test(e.key)) {
            e.preventDefault();
        }
    }

    /** @param {any} e */
    function toggleKnowledgeBase(e) {
        ontoggle?.({
            knowledgeIdx: knwoledgeIdx,
            checked: e.target.checked
        });
    }

    function deleteKnowledgeBase() {
        ondelete?.({
            knowledgeIdx: knwoledgeIdx
        });
    }

    /** @param {any} e */
    function changeKnowledgeBase(e) {
        const values = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        // Parent expects a JSON-stringified {name, type, ...} object; emit empty object on clear
        onchange?.({
            knowledgeIdx: knwoledgeIdx,
            field: 'knowledge',
            value: values[0] || JSON.stringify({ name: '', type: '' })
        });
    }

    /** @param {any} e */
    function changeConfidence(e) {
        onchange?.({
            knowledgeIdx: knwoledgeIdx,
            field: 'confidence',
            value: e.target.value
        });
    }

    function toggleCollapse() {
        oncollapse?.({
            knowledgeIdx: knwoledgeIdx,
            collapsed: !collapsed
        });
    }
</script>

<div class="kbi-wrapper">
    <div class="kbi-row kbi-row-primary">
        <div class="kbi-label kbi-label-strong">
            <div class="kbi-cell">
                <i
                    class="bx bx-chevron-right kbi-collapse-toggle"
                    class:rotated={!collapsed}
                    role="button"
                    tabindex="0"
                    onkeydown={() => {}}
                    onclick={() => toggleCollapse()}
                ></i>
            </div>
            <div class="kbi-cell">
                {`Collection #${knwoledgeIdx + 1}`}
            </div>
            <div class="kbi-tooltip-wrap">
                <label class="kbi-checkbox">
                    <input
                        type="checkbox"
                        class="kbi-checkbox-input"
                        checked={!knowledge.disabled}
                        onchange={e => toggleKnowledgeBase(e)}
                    />
                    <span class="kbi-checkbox-box"></span>
                </label>
            </div>
        </div>
        <div class="kbi-value">
            <div class="kbi-input-wrap kbi-cell">
                <Select
                    tag={`knowledge-base-${knwoledgeIdx}`}
                    containerStyles={'width: 100%;'}
                    placeholder={'Select a collection'}
                    disabled={knowledge.disabled}
                    selectedValues={selectedKb ? [JSON.stringify(selectedKb)] : []}
                    options={kbOptions}
                    onselect={e => changeKnowledgeBase(e)}
                />
            </div>
            <div class="kbi-delete kbi-cell">
                <i
                    class="bx bxs-no-entry kbi-delete-icon"
                    role="link"
                    tabindex="0"
                    onkeydown={() => {}}
                    onclick={() => deleteKnowledgeBase()}
                ></i>
            </div>
        </div>
    </div>

    {#if !collapsed}
    <div class="kbi-row kbi-row-secondary" transition:slide={{ duration: duration }}>
        <div class="kbi-content">
            <div class="kbi-list-item">
                <div class="kbi-label kbi-cell">
                    {'Confidence'}
                </div>
                <div class="kbi-value">
                    <div class="kbi-input-wrap kbi-cell">
                        <input
                            type="text"
                            class="kbi-input kbi-input-number"
                            bind:value={knowledge.confidence}
                            disabled={knowledge.disabled}
                            onkeydown={e => validateConfidenceInput(e)}
                            onblur={e => changeConfidence(e)}
                        />
                    </div>
                    <div class="kbi-delete kbi-cell"></div>
                </div>
            </div>
        </div>
    </div>
    {/if}
</div>

<style>
    .kbi-wrapper {
        border: 1px dotted var(--color-primary);
        border-radius: 0.375rem;
        padding: 0.625rem;
        background-color: color-mix(in srgb, var(--color-primary) 2%, transparent);
    }
    .kbi-row { display: flex; }
    .kbi-row-primary { display: flex; }
    .kbi-row-secondary { display: flex; flex-direction: column; }
    .kbi-cell { display: flex; align-items: center; }
    .kbi-label {
        width: 30%;
        font-size: 0.9375rem;
        flex-wrap: wrap;
        color: rgb(55 65 81);
    }
    .kbi-label-strong { font-weight: 700; display: flex; gap: 0.625rem; }
    .kbi-tooltip-wrap { display: flex; gap: 0.3125rem; align-items: center; }
    .kbi-value { width: 70%; display: flex; gap: 0.3125rem; }
    .kbi-input-wrap { width: 95%; }
    .kbi-delete { width: 5%; }
    .kbi-collapse-toggle {
        cursor: pointer;
        font-size: 1rem;
        color: rgb(75 85 99);
        transition: transform 0.2s ease-in-out, color 0.15s ease;
    }
    .kbi-collapse-toggle.rotated { transform: rotate(90deg); }
    .kbi-collapse-toggle:hover { color: var(--color-primary); }
    .kbi-delete-icon {
        cursor: pointer;
        font-size: 1rem;
        color: var(--color-danger);
        transition: filter 0.15s ease;
    }
    .kbi-delete-icon:hover { filter: brightness(1.1); }

    .kbi-checkbox {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        cursor: pointer;
        margin: 0;
    }
    .kbi-checkbox-input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
        margin: 0;
    }
    .kbi-checkbox-box {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 1px solid rgb(209 213 219);
        border-radius: 0.25rem;
        background-color: rgb(255 255 255);
        transition: border-color 0.15s ease, background-color 0.15s ease;
    }
    .kbi-checkbox-input:checked + .kbi-checkbox-box {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m3 8 3 3 7-7'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 0.75rem;
    }
    .kbi-checkbox-input:focus-visible + .kbi-checkbox-box {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 25%, transparent);
    }

    /* The collection Select is rendered via the Select component; only the
       confidence text input still uses .kbi-input here. */
    .kbi-input {
        width: 100%;
        padding: 0.4375rem 0.625rem;
        font-size: 0.8125rem;
        line-height: 1.4;
        color: rgb(17 24 39);
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        font-family: inherit;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .kbi-input-number { text-align: center; }
    .kbi-input:focus {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .kbi-input:disabled {
        background-color: rgb(243 244 246);
        cursor: not-allowed;
        color: var(--color-muted);
    }

    .kbi-content {
        display: flex;
        flex-direction: column;
        gap: 0.1875rem;
        border-top: 1px dotted var(--color-primary);
        margin-top: 0.625rem;
        padding-top: 0.625rem;
    }
    .kbi-list-item { display: flex; }

    @media (max-width: 1250px) {
        .kbi-row-primary { flex-direction: column; }
        .kbi-row .kbi-label,
        .kbi-row .kbi-value { width: 100%; }
        .kbi-row .kbi-value { flex-direction: column; }
        .kbi-row .kbi-input-wrap,
        .kbi-row .kbi-delete { width: 100%; }
        .kbi-row .kbi-delete {
            display: flex;
            justify-content: flex-end;
            align-items: end;
            margin-top: 0.375rem;
        }
    }
    :global(.dark) .kbi-wrapper {
        background-color: color-mix(in srgb, var(--color-primary) 6%, rgb(31 41 55));
    }
    :global(.dark) .kbi-label { color: rgb(229 231 235); }
    :global(.dark) .kbi-checkbox-box {
        background-color: rgb(17 24 39);
        border-color: rgb(75 85 99);
    }
    :global(.dark) .kbi-input {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .kbi-input:disabled { background-color: rgb(31 41 55); }
</style>
