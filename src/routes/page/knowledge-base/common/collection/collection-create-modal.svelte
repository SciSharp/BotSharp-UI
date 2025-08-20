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
	import { existVectorCollection } from "$lib/services/knowledge-base-service";

    
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

    /** @type {boolean} */
    let isValidCollection = true;

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
        dimension = 1536;
        provider = 'openai';
        model = 'text-embedding-3-small';
    }

    function toggle() {
        reset();
        toggleModal?.();
    }

    /** @param {string} text */
    function validateCollection(text) {
        return new Promise((resolve, reject) => {
            existVectorCollection(text).then(res => {
                resolve(res);
            }).catch(err => {
                reject(err);
            });
        });
    }

    /** @param {any} e */
    function changeCollectionText(e) {
        isValidCollection = true;
        collection = e.target.value;
    }

    /** @param {any} e */
    function handleConfirm(e) {
        e.preventDefault();

        validateCollection(_.trim(collection)).then(res => {
            if (res) {
                isValidCollection = false;
            } else {
                confirm?.({
                    collection_name: _.trim(collection),
                    dimension: dimension,
                    provider: _.trim(provider),
                    model: _.trim(model)
                });
            }
        }).catch(() => {
            isValidCollection = false;
        });
    }

    /** @param {any} e */
    function handleCancel(e) {
        e.preventDefault();
        reset();
        cancel?.();
    }

</script>

<Modal
    class={`vector-collection-create-container ${className}`}
    fade
    size={size}
    isOpen={open}
    toggle={() => toggle()}
    unmountOnClose
>
    <ModalHeader>
        <div>{title}</div>
    </ModalHeader>
    <ModalBody>
        <Form>
            <Row>
                <FormGroup class="collection-input">
                    <label class="fw-bold" for="collection">{`Collection name: `}</label>
                    <Input
                        type="text"
                        class={`text-center ${!isValidCollection ? 'invalid-input' : ''}`}
                        maxlength={maxLength}
                        value={collection}
                        on:input={(e) => changeCollectionText(e)}
                    />
                    <div class={`text-secondary text-count collection-note ${isValidCollection ? 'valid' : 'invalid'}`}>
                        {#if !isValidCollection}
                            <div style="color: var(--bs-danger);">{'* The collection already exists.'}</div>
                        {/if}
                        <div>{collection?.length || 0}/{maxLength}</div>
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
                        {'* The value must be larger than 0.'}
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