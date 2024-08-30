<script>
    import { onMount } from "svelte";
	import {
        Button,
        Form,
        FormGroup,
        Input,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        Row
    } from "@sveltestrap/sveltestrap";
    import _ from "lodash";

    
    /** @type {boolean} */
    export let open = false;

    /** @type {string} */
    export let className = "";

    /** @type {string} */
    export let title;

    /** @type {string} */
    export let size = 'sm';

    /** @type {number} */
    export let minDimension = 1;

    /** @type {number} */
    export let step = 1;

    /** @type {number} */
    export let maxLength = 20;

    /** @type {() => void} */
    export let toggleModal;

    /** @type {(args0: any) => void} */
    export let confirm;

    /** @type {() => void} */
    export let cancel;

    /** @type {string} */
    let collection;

    /** @type {number} */
    let dimension;

    onMount(() => {
        reset();
    });

    function reset() {
        collection = '';
        dimension = 1536;
    }

    /** @param {any} e */
    function handleConfirm(e) {
        e.preventDefault();
        confirm?.({
            collection: _.trim(collection),
            dimension: dimension
        });
    }

    /** @param {any} e */
    function handleCancel(e) {
        e.preventDefault();
        reset();
        cancel?.();
    }

</script>

<Modal class={className} fade size={size} isOpen={open} toggle={() => toggleModal && toggleModal()}>
    <ModalHeader class="knwoledge-edit-header">
        <div>{title}</div>
    </ModalHeader>
    <ModalBody>
        <Form class="knowledge-edit-form">
            <Row>
                <FormGroup class="edit-group">
                    <label class="fw-bold textarea-label" for="collection">{`Collection name: `}</label>
                    <Input
                        type="text"
                        maxlength={maxLength}
                        bind:value={collection}
                        on:input={() => {}}
                    />
                    <div class="text-secondary text-end text-count">
                        {collection?.length || 0}/{maxLength}
                    </div>
                </FormGroup>
            </Row>
            <Row>
                <FormGroup class="edit-group">
                    <label class="fw-bold textarea-label" for="dimension">{`Vector dimension: `}</label>
                    <Input
                        type="number"
                        class="text-center"
                        bind:value={dimension}
                        min={minDimension}
                        step={step}
                    />
                </FormGroup>
            </Row>
        </Form>
    </ModalBody>
    <ModalFooter>
        <Button
            color="primary"
            disabled={!_.trim(collection) || dimension <= 0}
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