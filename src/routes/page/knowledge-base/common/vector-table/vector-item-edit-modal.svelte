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
    class="modal show d-block"
    tabindex="-1"
    role="dialog"
    transition:fade={{ duration: 150 }}
    onclick={(e) => { if (e.target === e.currentTarget) toggleModal?.(); }}
    onkeydown={(e) => { if (e.key === 'Escape') toggleModal?.(); }}
>
    <div class={`modal-dialog modal-${size} ${className}`} role="document">
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <div>{title}</div>
                    <div>
                        <span class="fw-bold">Collection: </span>
                        <span class="text-primary collection-value">{collection}</span>
                    </div>
                </div>
                <button type="button" class="btn-close" aria-label="Close" onclick={() => toggleModal?.()}></button>
            </div>
            <div class="modal-body">
                <form onsubmit={(e) => handleConfirm(e)}>
                    {#if isQuestionAnswerCollection}
                    <div class="row">
                        <div class="mb-3 edit-group">
                            <label class="fw-bold textarea-label" for="question">
                                Question:
                            </label>
                            <textarea
                                class="form-control knowledge-textarea"
                                placeholder="Enter question..."
                                rows={question.rows}
                                maxlength={question.maxLength}
                                bind:value={question.text}
                            ></textarea>
                            <div class="text-secondary text-end text-count">
                                {question.text?.length || 0}/{question.maxLength}
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="mb-3 edit-group">
                            <label class="fw-bold textarea-label" for="answer">
                                Answer:
                            </label>
                            <textarea
                                class="form-control knowledge-textarea"
                                placeholder="Enter answer..."
                                rows={answer.rows}
                                maxlength={answer.maxLength}
                                bind:value={answer.text}
                            ></textarea>
                            <div class="text-secondary text-end text-count">
                                {answer.text?.length || 0}/{answer.maxLength}
                            </div>
                        </div>
                    </div>
                    {:else if isDocumentCollection}
                    <div class="row">
                        <div class="mb-3 edit-group">
                            <label class="fw-bold textarea-label" for="text">
                                Text:
                            </label>
                            <textarea
                                class="form-control knowledge-textarea"
                                placeholder="Enter text..."
                                rows={question.rows}
                                maxlength={question.maxLength}
                                bind:value={question.text}
                            ></textarea>
                            <div class="text-secondary text-end text-count">
                                {question.text?.length || 0}/{question.maxLength}
                            </div>
                        </div>
                    </div>
                    {/if}

                    {#if allowPayload}
                    <div class="row mt-2">
                        <div class="mb-3">
                            <div class="payload-container" bind:this={scrollContainer}>
                                {#if innerPayloads.length > 0}
                                <div class="payload-item">
                                    <div class="payload-item-content fw-bold" style="flex: 0.4;">Name</div>
                                    <div class="payload-item-content fw-bold" style="flex: 0.4;">Data Value</div>
                                    <div class="payload-item-content fw-bold" style="flex: 0.2;">Data Type</div>
                                    <div style="flex: 0 0 12px;"></div>
                                </div>
                                {/if}
                                {#each innerPayloads as payload, idx (payload.uuid)}
                                <div class="payload-item">
                                    <div class="payload-item-content line-align-center" style="flex: 0.4;">
                                        <input
                                            type="text"
                                            class="form-control"
                                            maxlength={1000}
                                            value={payload.key}
                                            oninput={e => changePayloadItem(e, idx, 'key')}
                                        />
                                    </div>
                                    <div class="payload-item-content line-align-center" style="flex: 0.4;">
                                        <input
                                            type="text"
                                            class="form-control"
                                            maxlength={1000}
                                            value={payload.value.data_value}
                                            oninput={e => changePayloadItem(e, idx, 'data_value')}
                                        />
                                    </div>
                                    <div class="payload-item-content line-align-center" style="flex: 0.2;">
                                        <Select
                                            tag={'payload-data-type-select'}
                                            placeholder={'Select'}
                                            selectedValues={payload.value.data_type ? [payload.value.data_type] : []}
                                            options={dataTypeOptions}
                                            onselect={e => changePayloadItem(e, idx, 'data_type')}
                                        />
                                    </div>
                                    <div class="line-align-center" style="flex: 0 0 12px;">
                                        <div class="line-align-center">
                                            <button
                                                type="button"
                                                class="btn btn-link p-0"
                                                aria-label="Remove payload"
                                                onclick={() => removePayloadItem(idx)}
                                            >
                                                <i class="bx bxs-no-entry text-danger clickable"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {/each}

                                {#if innerPayloads.length < payloadLimit}
                                    <div class="payload-item justify-content-end">
                                        <div class="payload-item-content line-align-center">
                                            <div class="d-flex justify-content-end">
                                                <button
                                                    type="button"
                                                    class="btn btn-link"
                                                    style="width: fit-content"
                                                    onclick={e => addPayloadItem(e)}
                                                >
                                                    Add Payload +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                    {/if}
                </form>
            </div>
            <div class="modal-footer">
                <button
                    type="button"
                    class="btn btn-primary"
                    disabled={disableConfirmBtn}
                    onclick={(e) => handleConfirm(e)}
                >
                    Confirm
                </button>
                <button
                    type="button"
                    class="btn btn-secondary"
                    onclick={(e) => handleCancel(e)}
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
</div>
<div class="modal-backdrop fade show" transition:fade={{ duration: 150 }}></div>
{/if}