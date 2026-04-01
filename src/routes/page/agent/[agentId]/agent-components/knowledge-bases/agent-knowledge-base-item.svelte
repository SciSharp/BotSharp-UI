<script>
    import { slide } from 'svelte/transition';
	import { DECIMAL_REGEX } from "$lib/helpers/constants";

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
        onchange?.({
            knowledgeIdx: knwoledgeIdx,
            field: 'knowledge',
            value: e.target.value
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
                {`Collection #${knwoledgeIdx + 1}`}
            </div>
            <div class="utility-tooltip">
                <div class="line-align-center">
                    <input
                        type="checkbox"
                        class="form-check-input"
                        checked={!knowledge.disabled}
                        onchange={e => toggleKnowledgeBase(e)}
                    />
                </div>
            </div>
        </div>
        <div class="utility-value">
            <div class="utility-input line-align-center">
                <select
                    class="form-select"
                    disabled={knowledge.disabled}
                    onchange={e => changeKnowledgeBase(e)}
                >
                    {#each [...knowledgeBaseOptions] as option}
                        <option value={`${JSON.stringify(option)}`} selected={option.name == knowledge.name}>
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
                    onclick={() => deleteKnowledgeBase()}
                ></i>
            </div>
        </div>
    </div>

    {#if !collapsed}
    <div class="utility-row utility-row-secondary" transition:slide={{ duration: duration }}>
        <div class="utility-content">
            <div class="utility-list-item">
                <div class="utility-label line-align-center">
                    {'Confidence'}
                </div>
                <div class="utility-value">
                    <div class="utility-input line-align-center">
                        <input
                            type="text"
                            class="form-control text-center"
                            bind:value={knowledge.confidence}
                            disabled={knowledge.disabled}
                            onkeydown={e => validateConfidenceInput(e)}
                            onblur={e => changeConfidence(e)}
                        />
                    </div>
                    <div class="utility-delete line-align-center"></div>
                </div>
            </div>
        </div>
    </div>
    {/if}
</div>