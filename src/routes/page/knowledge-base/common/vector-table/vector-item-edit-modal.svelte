<script>
    import { onMount } from "svelte";
	import {
        Button,
        Form,
        FormGroup,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        Row
    } from "@sveltestrap/sveltestrap";
    import { KnowledgeCollectionType } from "$lib/helpers/enums";
    import _ from "lodash";
	

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

    /** @type {() => void} */
    export let toggleModal;

    /** @type {(item: any) => void} */
    export let confirm;

    /** @type {() => void} */
    export let cancel;

    $: isQuestionAnswerCollection = collectionType === KnowledgeCollectionType.QuestionAnswer;
    $: isDocumentCollection = collectionType === KnowledgeCollectionType.Document;
    $: disableConfirmBtn = !_.trim(question.text) || (isQuestionAnswerCollection && !_.trim(answer.text));


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
            text: item?.data?.text || item?.data?.question || ''
        };

        answer = {
            ...answer,
            text: item?.data?.answer || ''
        };
    }

    /** @param {any} e */
    function handleConfirm(e) {
        e.preventDefault();

        const newItem = {
            ...item,
            data: {
                text: question.text,
                answer: answer.text
            }
        };
        confirm?.(newItem);
    }

    /** @param {any} e */
    function handleCancel(e) {
        e.preventDefault();
        cancel?.();
    }

</script>

<Modal class={className} fade size={size} isOpen={open} toggle={() => toggleModal && toggleModal()}>
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