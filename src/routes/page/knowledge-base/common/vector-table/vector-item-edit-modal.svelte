<script>
    import { onMount, tick } from "svelte";
    import { fade } from 'svelte/transition';
    import {
        KnowledgeBaseType,
        KnowledgePayloadName,
        VectorPayloadDataType
    } from "$lib/helpers/enums";
    import util from "lodash";
    import { v4 as uuidv4 } from 'uuid';
	import Select from "$lib/common/dropdowns/Select.svelte";

    let {
        /** @type {import('$knowledgeTypes').KnowledgeQueryViewModel | null} */
        item = null,
        /** @type {string} */
        collection = '',
        /** @type {string} */
        knowledgeType = '',
        /** @type {boolean} */
        open = false,
        /** @type {string} */
        className = "",
        /** @type {string} */
        title = '',
        /** @type {string} */
        size = 'md',
        /** @type {boolean} */
        allowPayload = true,
        /** @type {number} */
        payloadLimit = 10,
        /** @type {string[]} */
        excludedPayloads = [
            KnowledgePayloadName.Text,
            KnowledgePayloadName.DataSource
        ],
        /** @type {() => void} */
        toggleModal = () => {},
        /** @type {(item: any) => void} */
        confirm = () => {},
        /** @type {() => void} */
        cancel = () => {}
    } = $props();

    const dataTypeOptions = Object.entries(VectorPayloadDataType).map(([k, v]) => ({
        label: v.name.toLowerCase(),
        value: v.name
    }));

    let isQuestionAnswerCollection = $derived(knowledgeType === KnowledgeBaseType.QuestionAnswer);
    let isDocumentCollection = $derived(knowledgeType === KnowledgeBaseType.Document);

    /** @type {{ uuid: string, key: string, value: any }[]} */
    let innerPayloads = $state([]);

    /** @type {HTMLElement} */
    let scrollContainer;

    let question = $state({
        text: '',
        rows: 3,
        maxLength: 4096
    });

    let answer = $state({
        text: '',
        rows: 5,
        maxLength: 4096
    });

    let disableConfirmBtn = $derived(!util.trim(question.text) || (isQuestionAnswerCollection && !util.trim(answer.text)));

    onMount(() => {
        init();
    });

    function init() {
        question = {
            ...question,
            rows: isQuestionAnswerCollection ? 3 : 10,
            text: item?.payload?.text?.data_value || item?.payload?.question?.data_value || ''
        };

        answer = {
            ...answer,
            text: item?.payload?.answer?.data_value || ''
        };

        innerPayloads = Object.keys(item?.payload || {}).filter(key => !excludedPayloads.includes(key)).map(key => {
            const foundType = dataTypeOptions.find(x => x.value === item?.payload[key]?.data_type);
            return {
                uuid: uuidv4(),
                key: key,
                value: {
                    ...item?.payload[key] || {},
                    data_type: foundType?.value
                }
            };
        });
    }

    /** @param {any} e */
    async function addPayloadItem(e) {
        e.preventDefault();

        innerPayloads = [...innerPayloads, { uuid: uuidv4(), key: '', value: { data_value: '' } }];

        if (allowPayload && scrollContainer) {
            await tick();
            setTimeout(() => {
                scrollContainer.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }, 0);
        }
    }

    /**
     * @param {any} e
	 * @param {number} idx
     * @param {string} key
	 */
    function changePayloadItem(e, idx, key) {
        const found = innerPayloads.find((_, index) => index === idx);
        if (found) {
            if (key === 'key') {
                found.key = e.target.value;
            } else if (key === 'data_value') {
                found.value.data_value = e.target.value;
            } else if (key === 'data_type') {
                // @ts-ignore
                const selectedValues = e?.detail?.selecteds?.map(x => x.value) || [];
                found.value.data_type = selectedValues[0] || null;
            }
            innerPayloads = innerPayloads.map((x, index) => {
                return index === idx ? { ...found } : x;
            });
        }
    }

    /** @param {number} idx */
    function removePayloadItem(idx) {
        innerPayloads = innerPayloads.filter((_, index) => index !== idx);
    }

    /** @param {any} e */
    function handleConfirm(e) {
        e.preventDefault();

        if (!allowPayload) {
            innerPayloads = [];
        }

        const validPayloads = innerPayloads.map(x => ({
            key: util.trim(x.key),
            value: {
                data_value: util.trim(x.value.data_value),
                data_type: x.value.data_type || `${VectorPayloadDataType.String.id}`
            }
        })).filter(x => !!x.key && !!x.value.data_value && !excludedPayloads.includes(x.key));

        const obj = validPayloads.reduce((acc, cur) => {
            // @ts-ignore
            acc[cur.key] = {...cur.value}
            return acc;
        }, {});

        const newItem = {
            ...item,
            data: {
                text: question.text,
                answer: answer.text
            },
            payload: obj || {}
        };

        confirm?.(newItem);
    }

    /** @param {any} e */
    function handleCancel(e) {
        e.preventDefault();
        cancel?.();
    }

</script>

{#if open}
<div
    class="vie-modal"
    tabindex="-1"
    role="dialog"
    transition:fade={{ duration: 150 }}
    onclick={(e) => { if (e.target === e.currentTarget) toggleModal?.(); }}
    onkeydown={(e) => { if (e.key === 'Escape') toggleModal?.(); }}
>
    <div class={`vie-dialog vie-dialog-${size} ${className}`} role="document">
        <div class="vie-content">
            <div class="vie-header">
                <div class="vie-header-text">
                    <div class="vie-title">{title}</div>
                    <div class="vie-collection">
                        <span class="vie-collection-label">Collection: </span>
                        <span class="vie-collection-value">{collection}</span>
                    </div>
                </div>
                <button type="button" class="vie-close" aria-label="Close" onclick={() => toggleModal?.()}>
                    <i class="bx bx-x"></i>
                </button>
            </div>
            <div class="vie-body">
                <form onsubmit={(e) => handleConfirm(e)}>
                    {#if isQuestionAnswerCollection}
                    <div class="vie-row">
                        <div class="vie-edit-group">
                            <label class="vie-textarea-label" for="question">
                                Question:
                            </label>
                            <textarea
                                class="vie-textarea"
                                placeholder="Enter question..."
                                rows={question.rows}
                                maxlength={question.maxLength}
                                bind:value={question.text}
                            ></textarea>
                            <div class="vie-char-count">
                                {question.text?.length || 0}/{question.maxLength}
                            </div>
                        </div>
                    </div>
                    <div class="vie-row">
                        <div class="vie-edit-group">
                            <label class="vie-textarea-label" for="answer">
                                Answer:
                            </label>
                            <textarea
                                class="vie-textarea"
                                placeholder="Enter answer..."
                                rows={answer.rows}
                                maxlength={answer.maxLength}
                                bind:value={answer.text}
                            ></textarea>
                            <div class="vie-char-count">
                                {answer.text?.length || 0}/{answer.maxLength}
                            </div>
                        </div>
                    </div>
                    {:else if isDocumentCollection}
                    <div class="vie-row">
                        <div class="vie-edit-group">
                            <label class="vie-textarea-label" for="text">
                                Text:
                            </label>
                            <textarea
                                class="vie-textarea"
                                placeholder="Enter text..."
                                rows={question.rows}
                                maxlength={question.maxLength}
                                bind:value={question.text}
                            ></textarea>
                            <div class="vie-char-count">
                                {question.text?.length || 0}/{question.maxLength}
                            </div>
                        </div>
                    </div>
                    {/if}

                    {#if allowPayload}
                    <div class="vie-row vie-payload-row">
                        <div class="vie-payload-container" bind:this={scrollContainer}>
                            {#if innerPayloads.length > 0}
                            <div class="vie-payload-item">
                                <div class="vie-payload-item-content vie-payload-header" style="flex: 0.4;">Name</div>
                                <div class="vie-payload-item-content vie-payload-header" style="flex: 0.4;">Data Value</div>
                                <div class="vie-payload-item-content vie-payload-header" style="flex: 0.2;">Data Type</div>
                                <div class="vie-payload-remove-spacer"></div>
                            </div>
                            {/if}
                            {#each innerPayloads as payload, idx (payload.uuid)}
                            <div class="vie-payload-item">
                                <div class="vie-payload-item-content" style="flex: 0.4;">
                                    <input
                                        type="text"
                                        class="vie-input"
                                        maxlength={1000}
                                        value={payload.key}
                                        oninput={e => changePayloadItem(e, idx, 'key')}
                                    />
                                </div>
                                <div class="vie-payload-item-content" style="flex: 0.4;">
                                    <input
                                        type="text"
                                        class="vie-input"
                                        maxlength={1000}
                                        value={payload.value.data_value}
                                        oninput={e => changePayloadItem(e, idx, 'data_value')}
                                    />
                                </div>
                                <div class="vie-payload-item-content" style="flex: 0.2;">
                                    <Select
                                        tag={'payload-data-type-select'}
                                        placeholder={'Select'}
                                        selectedValues={payload.value.data_type ? [payload.value.data_type] : []}
                                        options={dataTypeOptions}
                                        onselect={e => changePayloadItem(e, idx, 'data_type')}
                                    />
                                </div>
                                <div class="vie-payload-remove">
                                    <button
                                        type="button"
                                        class="vie-remove-btn"
                                        aria-label="Remove payload"
                                        onclick={() => removePayloadItem(idx)}
                                    >
                                        <i class="bx bxs-no-entry"></i>
                                    </button>
                                </div>
                            </div>
                            {/each}

                            {#if innerPayloads.length < payloadLimit}
                                <div class="vie-payload-item vie-payload-add-row">
                                    <div class="vie-payload-item-content vie-payload-add-wrap">
                                        <button
                                            type="button"
                                            class="vie-link-btn"
                                            onclick={e => addPayloadItem(e)}
                                        >
                                            Add Payload +
                                        </button>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                    {/if}
                </form>
            </div>
            <div class="vie-footer">
                <button
                    type="button"
                    class="vie-btn vie-btn-primary"
                    disabled={disableConfirmBtn}
                    onclick={(e) => handleConfirm(e)}
                >
                    Confirm
                </button>
                <button
                    type="button"
                    class="vie-btn vie-btn-secondary"
                    onclick={(e) => handleCancel(e)}
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
</div>
<div class="vie-backdrop" transition:fade={{ duration: 150 }}></div>
{/if}

<style>
    /* ===== Modal overlay & dialog ===== */
    .vie-modal {
        position: fixed;
        inset: 0;
        z-index: 1055;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 1.75rem 0.5rem;
        overflow-x: hidden;
        overflow-y: auto;
        outline: 0;
    }
    .vie-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1050;
        background-color: rgb(0 0 0);
        opacity: 0.5;
    }
    .vie-dialog {
        position: relative;
        width: 100%;
        margin: 0 auto;
        max-width: 500px;
        pointer-events: none;
    }
    .vie-dialog-sm { max-width: 300px; }
    .vie-dialog-md { max-width: 500px; }
    .vie-dialog-lg { max-width: 800px; }
    .vie-dialog-xl { max-width: 1140px; }
    .vie-content {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        background-color: rgb(255 255 255);
        background-clip: padding-box;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.625rem;
        box-shadow:
            0 1px 3px rgb(15 23 42 / 0.1),
            0 20px 25px -5px rgb(15 23 42 / 0.15);
        pointer-events: auto;
        outline: 0;
    }

    /* ===== Header ===== */
    .vie-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid rgb(243 244 246);
    }
    .vie-header-text {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1 1 auto;
    }
    .vie-title {
        font-size: 1rem;
        font-weight: 600;
        color: rgb(17 24 39);
    }
    .vie-collection {
        font-size: 0.8125rem;
        color: var(--color-muted);
    }
    .vie-collection-label {
        font-weight: 700;
    }
    .vie-collection-value {
        font-size: 0.9375rem;
        color: var(--color-primary);
    }
    .vie-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.875rem;
        height: 1.875rem;
        padding: 0;
        background: transparent;
        border: 0;
        border-radius: 0.375rem;
        color: var(--color-muted);
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
    }
    .vie-close i {
        font-size: 1.25rem;
        line-height: 1;
    }
    .vie-close:hover {
        background-color: rgb(243 244 246);
        color: rgb(17 24 39);
    }

    /* ===== Body / Footer ===== */
    .vie-body {
        position: relative;
        padding: 1rem 1.25rem;
        flex: 1 1 auto;
    }
    .vie-footer {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        border-top: 1px solid rgb(243 244 246);
    }

    /* ===== Buttons ===== */
    .vie-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        height: 2.25rem;
        padding: 0 0.95rem;
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1;
        border: 1px solid transparent;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .vie-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .vie-btn-primary {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        color: rgb(255 255 255);
    }
    .vie-btn-primary:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }
    .vie-btn-secondary {
        background-color: rgb(255 255 255);
        border-color: rgb(229 231 235);
        color: rgb(55 65 81);
    }
    .vie-btn-secondary:hover:not(:disabled) {
        background-color: rgb(249 250 251);
        border-color: rgb(209 213 219);
    }

    /* ===== Form layout ===== */
    .vie-row {
        display: block;
        margin-bottom: 1rem;
    }
    .vie-row:last-child {
        margin-bottom: 0;
    }
    .vie-payload-row {
        margin-top: 0.5rem;
    }
    .vie-edit-group {
        display: flex;
        flex-direction: column;
    }
    .vie-textarea-label {
        font-weight: 700;
        font-size: 0.9375rem;
        margin-bottom: 0.375rem;
        color: rgb(55 65 81);
    }
    .vie-textarea {
        width: 100%;
        padding: 0.625rem 0.75rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        background-color: rgb(249 250 251);
        font-size: 0.875rem;
        line-height: 1.5;
        color: rgb(17 24 39);
        resize: vertical;
        scrollbar-width: thin;
        font-family: inherit;
        transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
    }
    .vie-textarea::placeholder {
        color: var(--color-muted);
    }
    .vie-textarea:focus {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .vie-char-count {
        margin-top: 0.125rem;
        font-size: 0.625rem;
        color: var(--color-muted);
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    /* ===== Payload table ===== */
    .vie-payload-container {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        min-height: 100px;
        max-height: 300px;
        overflow-y: auto;
        scrollbar-width: thin;
    }
    .vie-payload-item {
        display: flex;
        gap: 0.625rem;
        align-items: center;
    }
    .vie-payload-item-content {
        display: flex;
        align-items: center;
    }
    .vie-payload-header {
        font-weight: 700;
        font-size: 0.8125rem;
        color: rgb(55 65 81);
    }
    .vie-payload-remove-spacer {
        flex: 0 0 12px;
    }
    .vie-payload-remove {
        flex: 0 0 12px;
        display: flex;
        align-items: center;
    }
    .vie-remove-btn {
        padding: 0;
        background: transparent;
        border: 0;
        color: var(--color-danger);
        cursor: pointer;
        line-height: 1;
    }
    .vie-remove-btn i {
        font-size: 1.125rem;
    }
    .vie-remove-btn:hover {
        filter: brightness(0.85);
    }
    .vie-input {
        width: 100%;
        height: 2.25rem;
        padding: 0 0.625rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        background-color: rgb(249 250 251);
        font-size: 0.8125rem;
        color: rgb(17 24 39);
        font-family: inherit;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
    }
    .vie-input:focus {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .vie-payload-add-row {
        justify-content: flex-end;
    }
    .vie-payload-add-wrap {
        justify-content: flex-end;
    }
    .vie-link-btn {
        padding: 0;
        background: transparent;
        border: 0;
        color: var(--color-primary);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        width: fit-content;
    }
    .vie-link-btn:hover {
        text-decoration: underline;
    }

    /* ===== Dark mode ===== */
    :global(.dark) .vie-content {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .vie-header,
    :global(.dark) .vie-footer {
        border-color: rgb(55 65 81);
    }
    :global(.dark) .vie-title,
    :global(.dark) .vie-textarea-label,
    :global(.dark) .vie-payload-header {
        color: rgb(243 244 246);
    }
    :global(.dark) .vie-textarea,
    :global(.dark) .vie-input {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(243 244 246);
    }
    :global(.dark) .vie-textarea:focus,
    :global(.dark) .vie-input:focus {
        background-color: rgb(31 41 55);
    }
    :global(.dark) .vie-btn-secondary {
        background-color: rgb(55 65 81);
        border-color: rgb(75 85 99);
        color: rgb(229 231 235);
    }
    :global(.dark) .vie-btn-secondary:hover:not(:disabled) {
        background-color: rgb(75 85 99);
        border-color: rgb(107 114 128);
    }
    :global(.dark) .vie-close:hover {
        background-color: rgb(55 65 81);
        color: rgb(243 244 246);
    }
</style>