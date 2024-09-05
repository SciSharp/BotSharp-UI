<script>
	import {
        Button,
        Input,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        Row,
        Form,
        FormGroup
    } from "@sveltestrap/sveltestrap";
    import _ from "lodash";

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
    export let limit = 10;
    
    /** @type {string} */
    export let title = "Add states";

    /** @type {boolean} */
    export let validateKey = true;
    export let validateValue = true;
    export let requireActiveRounds = false;

    /** @type {import('$conversationTypes').UserStateDetailModel[]} */
    export let states = [];

    /** @type {import('$conversationTypes').UserStateDetailModel} */
    const defaultState = {
        key: { data: '', isValid: true },
        value: { data: '', isValid: true },
        active_rounds: { data: -1, isValid: true }
    };

    $: {
        if (isOpen) {
            if (states?.length > 0) {
                states = [...states];
            } else {
                states = [{...JSON.parse(JSON.stringify(defaultState))}];
            }
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
            if (!!!key && validateKey) {
                state.key.isValid = false;
                isValidForm = isValidForm && state.key.isValid;
            }

            if (!!!value && validateValue) {
                state.value.isValid = false;
                isValidForm = isValidForm && state.value.isValid;
            }
            return state;
        });

        if (!isValidForm) return;
        confirm && confirm();
    }

    /** @param {any} e */
    function handleCancel(e) {
        e.preventDefault();
        cancel && cancel();
    }

    function addState() {
        states = [...states, {...JSON.parse(JSON.stringify(defaultState))}];
    }

    /** @param {number} index */
    function remove(index) {
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

    /** 
     * @param {any} e 
     * @param {number} index
    */
    function changeActiveRounds(e, index) {
        states = states.map((state, idx) => {
            if (idx === index) {
                state.active_rounds.isValid = true;
                state.active_rounds.data = validateActiveRounds(Number(e.target.value) || 0);
            }
            return state;
        });
    }

    /** @param {number} rounds */
    function validateActiveRounds(rounds) {
        let res = rounds;
        const lowerLimit = -1;
        const upperLimit = 9999;

        if (rounds < lowerLimit) {
            res = lowerLimit;
        } else if (rounds > upperLimit) {
            res = upperLimit;
        }
        return res;
    }
</script>

<Modal class={className} fade size={size} isOpen={isOpen} toggle={() => toggleModal && toggleModal()}>
    <ModalHeader>{title}</ModalHeader>
    <ModalBody>
        <Form class="state-form">
            {#each states as state, idx (idx)}
            <Row>
                <div class={`${requireActiveRounds ? 'state-key-input' : 'state-input'}`}>
                    <FormGroup>
                        {#if idx === 0}
                        <label for="key">
                            {`Key ${validateKey ? '(Required)' : '(Optional)'}`}
                        </label>
                        {/if}
                        <Input class={`${!state.key.isValid ? 'invalid' : ''}`} placeholder="Enter a key" value={state.key.data} maxlength={50} on:input={(e) => changeKey(e, idx)} />
                    </FormGroup>
                </div>
                <div class={`${requireActiveRounds ? 'state-key-input' : 'state-input'}`}>
                    <FormGroup>
                        {#if idx === 0}
                        <label for="value">
                            {`Value ${validateValue ? '(Required)' : '(Optional)'}`}
                        </label>
                        {/if}
                        <Input class={`${!state.value.isValid ? 'invalid' : ''}`} placeholder="Enter a value" value={state.value.data} maxlength={1000} on:input={(e) => changeValue(e, idx)} />
                    </FormGroup>
                </div>
                {#if requireActiveRounds}
                <div class="state-num-input">
                    <FormGroup>
                        {#if idx === 0}
                        <label for="value">
                            {`Active rounds (Optional)`}
                        </label>
                        {/if}
                        <Input type="number" placeholder="Enter a value" value={state.active_rounds.data} on:input={(e) => changeActiveRounds(e, idx)} />
                    </FormGroup>
                </div>
                {/if}
                <div class="state-delete mb-3 line-align-center">
                    {#if idx !== 0}
                    <div>
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <span><i class="bx bx-no-entry clickable" on:click={() => remove(idx)} /></span>
                    </div>
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