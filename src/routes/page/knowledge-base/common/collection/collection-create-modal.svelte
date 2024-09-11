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
    export let size = 'md';

    /** @type {number} */
    export let minDimension = 1;

    /** @type {number} */
    export let step = 1;

    /** @type {number} */
    export let maxLength = 30;

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

    /** @type {string} */
    let provider;

    /** @type {string} */
    let model;

    $: disableConfirmBtn = (!_.trim(collection) || collection.length > maxLength) ||
                            (!_.trim(provider) || provider.length > maxLength) ||
                            (!_.trim(model) || model.length > maxLength) ||
                            dimension <= 0;

    onMount(() => {
        reset();
    });

    function reset() {
        collection = '';
        dimension = 3072;
        provider = 'openai';
        model = 'text-embedding-3-large';
    }

    function toggle() {
        reset();
        toggleModal?.();
    }

    /** @param {any} e */
    function handleConfirm(e) {
        e.preventDefault();
        confirm?.({
            collection_name: _.trim(collection),
            dimension: dimension,
            provider: _.trim(provider),
            model: _.trim(model)
        });
    }

    /** @param {any} e */
    function handleCancel(e) {
        e.preventDefault();
        reset();
        cancel?.();
    }

</script>

<Modal class={className} fade size={size} isOpen={open} toggle={() => toggle()}>
    <ModalHeader>
        <div>{title}</div>
    </ModalHeader>
    <ModalBody>
        <Form>
            <Row>
                <FormGroup>
                    <label class="fw-bold" for="collection">{`Collection name: `}</label>
                    <Input
                        type="text"
                        class="text-center"
                        maxlength={maxLength}
                        bind:value={collection}
                    />
                    <div class="text-secondary text-end text-count">
                        {collection?.length || 0}/{maxLength}
                    </div>
                </FormGroup>
            </Row>
            <Row>
                <FormGroup>
                    <label class="fw-bold" for="provider">{`Embedding provider: `}</label>
                    <Input
                        type="text"
                        class="text-center"
                        maxlength={maxLength}
                        bind:value={provider}
                    />
                    <div class="text-secondary text-end text-count">
                        {provider?.length || 0}/{maxLength}
                    </div>
                </FormGroup>
            </Row>
            <Row>
                <FormGroup>
                    <label class="fw-bold" for="model">{`Embedding model: `}</label>
                    <Input
                        type="text"
                        class="text-center"
                        maxlength={maxLength}
                        bind:value={model}
                    />
                    <div class="text-secondary text-end text-count">
                        {model?.length || 0}/{maxLength}
                    </div>
                </FormGroup>
            </Row>
            <Row>
                <FormGroup>
                    <label class="fw-bold" for="dimension">{`Vector dimension: `}</label>
                    <Input
                        type="number"
                        class="text-center"
                        bind:value={dimension}
                        min={minDimension}
                        step={step}
                    />
                    <div class="text-secondary text-count">
                        {'* The value must be larger than zero.'}
                    </div>
                </FormGroup>
            </Row>
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