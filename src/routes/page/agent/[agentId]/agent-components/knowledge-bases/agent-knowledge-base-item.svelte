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


