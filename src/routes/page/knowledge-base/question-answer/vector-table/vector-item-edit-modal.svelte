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
    import _ from "lodash";

    /** @type {import('$types').KnowledgeSearchViewModel | null} */
    export let item;

    /** @type {string} */
    export let collection;

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
            <Row>
                <FormGroup class="edit-group">
                    <label class="fw-bold textarea-label" for="question">{`Question: `}</label>
                    <textarea
                        class={'form-control knowledge-textarea'}
                        placeholder="Enter question..."
                        rows={question.rows}
                        bind:value={question.text}
                        maxlength={question.maxLength}
                        on:input={() => {}}
                    />
                    <div class="text-secondary text-end text-count">
                        {question.text?.length || 0}/{question.maxLength}
                    </div>
                </FormGroup>
            </Row>
            <Row>
                <FormGroup class="edit-group">
                    <label class="fw-bold textarea-label" for="answer">{`Answer: `}</label>
                    <textarea
                        class={'form-control knowledge-textarea'}
                        placeholder="Enter answer..."
                        rows={answer.rows}
                        bind:value={answer.text}
                        maxlength={answer.maxLength}
                        on:input={() => {}}
                    />
                    <div class="text-secondary text-end text-count">
                        {answer.text?.length || 0}/{answer.maxLength}
                    </div>
                </FormGroup>
            </Row>
        </Form>
    </ModalBody>
    <ModalFooter>
        <Button
            color="primary"
            disabled={!!!_.trim(question.text) || !!!_.trim(answer.text)}
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