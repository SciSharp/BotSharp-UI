<script>
    import { onMount, tick } from "svelte";
	import {
        Button,
        Form,
        FormGroup,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        Row,
        Input
    } from "@sveltestrap/sveltestrap";
    import {
        KnowledgeCollectionType,
        KnowledgePayloadName,
        VectorPayloadDataType
    } from "$lib/helpers/enums";
    import util from "lodash";
    import { v4 as uuidv4 } from 'uuid';
	import Select from "$lib/common/Select.svelte";
	

    /** @type {import('$knowledgeTypes').KnowledgeSearchViewModel | null} */
    export let item;

    /** @type {string} */
    export let collection;

    /** @type {string} */
    export let collectionType;

    /** @type {boolean} */
    export let open = false;

    /** @type {string} */
    export let className = "";

    /** @type {string} */
    export let title;

    /** @type {string} */
    export let size = 'md';

    /** @type {boolean} */
    export let allowPayload = true;

    /** @type {number} */
    export let payloadLimit = 10;

    /** @type {string[]} */
    export let excludedPayloads = [
        KnowledgePayloadName.Text,
        KnowledgePayloadName.DataSource
    ];

    /** @type {() => void} */
    export let toggleModal;

    /** @type {(item: any) => void} */
    export let confirm;

    /** @type {() => void} */
    export let cancel;


    const dataTypeOptions = Object.entries(VectorPayloadDataType).map(([k, v]) => ({
        label: v.name.toLowerCase(),
        value: v.name
    }));

    $: isQuestionAnswerCollection = collectionType === KnowledgeCollectionType.QuestionAnswer;
    $: isDocumentCollection = collectionType === KnowledgeCollectionType.Document;
    $: disableConfirmBtn = !util.trim(question.text) || (isQuestionAnswerCollection && !util.trim(answer.text));

    /** @type {{ uuid: string, key: string, value: any }[]} */
    let innerPayloads = [];

    /** @type {HTMLElement} */
    let scrollContainer;

    let question = {
        text: '',
        rows: 3,
        maxLength: 4096
    };

    let answer = {
        text: '',
        rows: 5,
        maxLength: 4096
    }

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

<Modal
    class={className}
    fade
    size={size}
    isOpen={open}
    toggle={() => toggleModal && toggleModal()}
    unmountOnClose
>
    <ModalHeader>
        <div>{title}</div>
        <div>
            <span class="fw-bold">{'Collection: '}</span>
            <span class="text-primary collection-value">{collection}</span>
        </div>
    </ModalHeader>
    <ModalBody>
        <Form>
            {#if isQuestionAnswerCollection}
            <Row>
                <FormGroup class="edit-group">
                    <label class="fw-bold textarea-label" for="question">
                        {`Question: `}
                    </label>
                    <textarea
                        class={'form-control knowledge-textarea'}
                        placeholder="Enter question..."
                        rows={question.rows}
                        maxlength={question.maxLength}
                        bind:value={question.text}
                        on:input={() => {}}
                    />
                    <div class="text-secondary text-end text-count">
                        {question.text?.length || 0}/{question.maxLength}
                    </div>
                </FormGroup>
            </Row>
            <Row>
                <FormGroup class="edit-group">
                    <label class="fw-bold textarea-label" for="answer">
                        {`Answer: `}
                    </label>
                    <textarea
                        class={'form-control knowledge-textarea'}
                        placeholder="Enter answer..."
                        rows={answer.rows}
                        maxlength={answer.maxLength}
                        bind:value={answer.text}
                    />
                    <div class="text-secondary text-end text-count">
                        {answer.text?.length || 0}/{answer.maxLength}
                    </div>
                </FormGroup>
            </Row>
            {:else if isDocumentCollection}
            <Row>
                <FormGroup class="edit-group">
                    <label class="fw-bold textarea-label" for="text">
                        {`Text: `}
                    </label>
                    <textarea
                        class={'form-control knowledge-textarea'}
                        placeholder="Enter text..."
                        rows={question.rows}
                        maxlength={question.maxLength}
                        bind:value={question.text}
                    />
                    <div class="text-secondary text-end text-count">
                        {question.text?.length || 0}/{question.maxLength}
                    </div>
                </FormGroup>
            </Row>
            {/if}

            {#if allowPayload}
            <Row class="mt-2">
                <FormGroup>
                    <div class="payload-container" bind:this={scrollContainer}>
                        {#if innerPayloads.length > 0}
                        <div class="payload-item">
                            <div class="payload-item-content fw-bold" style="flex: 0.4;">{'Name'}</div>
                            <div class="payload-item-content fw-bold" style="flex: 0.4;">{'Data Value'}</div>
                            <div class="payload-item-content fw-bold" style="flex: 0.2;">{'Data Type'}</div>
                            <div style="flex: 0 0 12px;"></div>
                        </div>
                        {/if}
                        {#each innerPayloads as payload, idx (payload.uuid)}
                        <div class="payload-item">
                            <div class="payload-item-content line-align-center" style="flex: 0.4;">
                                <Input
                                    type="text"
                                    maxlength={1000}
                                    value={payload.key}
                                    on:input={e => changePayloadItem(e, idx, 'key')}
                                />
                            </div>
                            <div class="payload-item-content line-align-center" style="flex: 0.4;">
                                <Input
                                    type="text"
                                    maxlength={1000}
                                    value={payload.value.data_value}
                                    on:input={e => changePayloadItem(e, idx, 'data_value')}
                                />
                            </div>
                            <div class="payload-item-content line-align-center" style="flex: 0.2;">
                                <Select
                                    tag={'payload-data-type-select'}
                                    placeholder={'Select'}
                                    selectedValues={payload.value.data_type ? [payload.value.data_type] : []}
                                    options={dataTypeOptions}
                                    on:select={e => changePayloadItem(e, idx, 'data_type')}
                                />
                            </div>
                            <div class="line-align-center" style="flex: 0 0 12px;">
                                <div class="line-align-center">
                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                                    <i
                                        class="bx bx-no-entry text-danger clickable"
                                        on:click={() => removePayloadItem(idx)}
                                    />
                                </div>
                            </div>
                        </div>
                        {/each}

                        {#if innerPayloads.length < payloadLimit}
                            <div class="payload-item justify-content-end">
                                <div class="payload-item-content line-align-center">
                                    <div class="d-flex justify-content-end">
                                        <Button
                                            color="link"
                                            style="width: fit-content"
                                            on:click={e => addPayloadItem(e)}
                                        >
                                            {'Add Payload +'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                </FormGroup>
            </Row>
            {/if}
        </Form>
    </ModalBody>
    <ModalFooter>
        <Button
            color="primary"
            disabled={disableConfirmBtn}
            on:click={(e) => handleConfirm(e)}
        >
            Confirm
        </Button>
        <Button
            color="secondary"
            on:click={(e) => handleCancel(e)}
        >
            Cancel
        </Button>
    </ModalFooter>
</Modal>