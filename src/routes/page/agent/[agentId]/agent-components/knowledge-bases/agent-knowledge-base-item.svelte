<script>
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import { Input } from '@sveltestrap/sveltestrap';
	import { DECIMAL_REGEX } from "$lib/helpers/constants";
	
    const svelteDispatch = createEventDispatcher();
    const duration = 200;

    /** @type {import('$agentTypes').AgentKnowledgeBase} */
    export let knowledge;

    /** @type {number} */
    export let knwoledgeIdx;

    /** @type {any[]} */
    export let knowledgeBaseOptions = [];

    /** @type {boolean} */
    export let collapsed = true;


    /** @param {any} e */
    function validateConfidenceInput(e) {
        const reg = new RegExp(DECIMAL_REGEX, 'g');
        if (e.key !== 'Backspace' && !reg.test(e.key)) {
            e.preventDefault();
        }
    }

    /**
     * @param {any} e
	 */
    function toggleKnowledgeBase(e) {
        svelteDispatch('toggle', {
            knowledgeIdx: knwoledgeIdx,
            checked: e.target.checked
        });
    }

    function deleteKnowledgeBase() {
        svelteDispatch('delete', {
            knowledgeIdx: knwoledgeIdx
        });
    }

    /**
     * @param {any} e
	 */
    function changeKnowledgeBase(e) {
        svelteDispatch('change', {
            knowledgeIdx: knwoledgeIdx,
            field: 'knowledge',
            value: e.target.value
        });
    }

    /**
     * @param {any} e
	 */
    function changeConfidence(e) {
        svelteDispatch('change', {
            knowledgeIdx: knwoledgeIdx,
            field: 'confidence',
            value: e.target.value
        });
    }

    function toggleCollapse() {
        svelteDispatch('collapse', {
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
                    on:keydown={() => {}}
                    on:click={() => toggleCollapse()}
                />
            </div>
            <div class="line-align-center">
                {`Collection #${knwoledgeIdx + 1}`}
            </div>
            <div class="utility-tooltip">
                <div class="line-align-center">
                    <Input
                        type="checkbox"
                        checked={!knowledge.disabled}
                        on:change={e => toggleKnowledgeBase(e)}
                    />
                </div>
                <!-- <div
                    class="line-align-center"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Uncheck to disable knowledgebase"
                >
                    <i class="bx bx-info-circle fs-6" />
                </div> -->
            </div>
        </div>
        <div class="utility-value">
            <div class="utility-input line-align-center">
                <Input
                    type="select"
                    disabled={knowledge.disabled}
                    on:change={e => changeKnowledgeBase(e)}
                >
                    {#each [...knowledgeBaseOptions] as option}
                        <option value={`${JSON.stringify(option)}`} selected={option.name == knowledge.name}>
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
                    on:click={() => deleteKnowledgeBase()}
                />
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
                        <Input
                            type="text"
                            class="text-center"
                            bind:value={knowledge.confidence}
                            disabled={knowledge.disabled}
                            on:keydown={e => validateConfidenceInput(e)}
                            on:blur={e => changeConfidence(e)}
                        />
                    </div>
                    <div class="utility-delete line-align-center"></div>
                </div>
            </div>
        </div>
    </div>
    {/if}
</div>