<script>
	import { Button, Input, Modal, ModalBody, ModalFooter, ModalHeader, Row, Form, FormGroup } from "@sveltestrap/sveltestrap";
    import _ from "lodash";
    import { page } from '$app/stores';
	import { conversationUserStateStore } from "$lib/helpers/store";

    /** @type {boolean} */
    export let isOpen;

    /** @type {string} */
    export let size = 'xl';

    /** @type {string} */
    export let className = '';

    /** @type {() => void} */
    export let toggleModal;

    /** @type {() => void} */
    export let confirm;

    /** @type {() => void} */
    export let cancel;

    /** @type {number} */
    const limit = 10;
    const params = $page.params;

    /** @type {import('$types').UserStateDetailModel[]} */
    let states = [];

    $: {
        if (isOpen) {
            const conversationUserStates = conversationUserStateStore.get();
            if (!!conversationUserStates && conversationUserStates.conversationId == params.conversationId && !!conversationUserStates.states) {
                states = [...conversationUserStates.states];
            } else {
                states = [{ key: { data: '', isValid: true }, value: { data: '', isValid: true } }];
            }
        } else {
            states = [];
        }
    }


    /** @param {any} e */
    function handleConfirm(e) {
        e.preventDefault();

        // form validation
        let isValidForm = true;
        states = states.map(state => {
            const key = _.trim(state.key.data);
            const value = _.trim(state.value.data);
            if (!!!key) {
                state.key.isValid = false;
            }

            if (!!!value) {
                state.value.isValid = false;
            }

            isValidForm = isValidForm && state.key.isValid && state.value.isValid;
            return state;
        });

        if (!isValidForm) return;

        const cleanStates = states.map(state => {
            state.key.data = _.trim(state.key.data);
            state.value.data = _.trim(state.value.data);
            return state;
        });
        conversationUserStateStore.put({
            conversationId: params.conversationId,
            states: cleanStates
        });
        confirm && confirm();
    }

    /** @param {any} e */
    function handleCancel(e) {
        e.preventDefault();
        cancel && cancel();
    }

    function addState() {
        states = [...states, { key: { data: '', isValid: true }, value: { data: '', isValid: true } }];
    }

    /** @param {number} index */
    function removeState(index) {
        states = states.filter((x, idx) => idx !== index);
    }

    /** 
     * @param {any} e 
     * @param {number} index
    */
    function changeKey(e, index) {
        states = states.map((state, idx) => {
            if (idx === index) {
                state.key.isValid = true;
                state.key.data = e.target.value;
            }
            return state;
        });
    }

    /** 
     * @param {any} e 
     * @param {number} index
    */
    function changeValue(e, index) {
        states = states.map((state, idx) => {
            if (idx === index) {
                state.value.isValid = true;
                state.value.data = e.target.value;
            }
            return state;
        });
    }
</script>

<Modal class={className} fade size={size} isOpen={isOpen} toggle={() => toggleModal && toggleModal()}>
    <ModalHeader>Add states</ModalHeader>
    <ModalBody>
        <Form class="state-form">
            {#each states as state, idx (idx)}
            <Row>
                <div class="state-input">
                    <FormGroup>
                        {#if idx === 0}
                        <label for="key">Key</label>
                        {/if}
                        <Input class={`${!state.key.isValid ? 'invalid' : ''}`} placeholder="Enter a key" value={state.key.data} maxlength={50} on:input={(e) => changeKey(e, idx)} />
                    </FormGroup>
                </div>
                <div class="state-input">
                    <FormGroup>
                        {#if idx === 0}
                        <label for="value">Value</label>
                        {/if}
                        <Input class={`${!state.value.isValid ? 'invalid' : ''}`} placeholder="Enter a value" value={state.value.data} maxlength={100} on:input={(e) => changeValue(e, idx)} />
                    </FormGroup>
                </div>
                <div class="state-delete">
                    {#if idx !== 0}
                    <Button
                        class="btn btn-sm btn-rounded"
                        color="danger"
                        on:click={() => removeState(idx)}
                    >
                        <i class="mdi mdi-window-close"></i>
                    </Button>
                    {/if}
                </div>
            </Row>
            {/each}
            <Row>
                <div>
                    <Button 
                        color="primary"
                        class="btn btn-primary"
                        disabled={states.length >= limit}
                        on:click={() => addState()}
                    >
                        Add +
                    </Button>
                </div>
            </Row>
        </Form>
    </ModalBody>
    <ModalFooter>
      <Button color="primary" on:click={(e) => handleConfirm(e)}>Confirm</Button>
      <Button color="secondary" on:click={(e) => handleCancel(e)}>Cancel</Button>
    </ModalFooter>
</Modal>