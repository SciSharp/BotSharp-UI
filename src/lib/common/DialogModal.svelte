<script>
    import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@sveltestrap/sveltestrap";

    /** @type {boolean} */
    export let isOpen;

    /** @type {string} */
    export let size = 'xl';

    /** @type {string} */
    export let title;

    /** @type {string} */
    export let className = '';

    /** @type {string} */
    export let confirmBtnText = 'Confirm';

    /** @type {string} */
    export let cancelBtnText = 'Cancel';

    /** @type {() => void} */
    export let toggleModal;

    /** @type {() => void} */
    export let confirm;

    /** @type {boolean} */
    export let disableConfirmBtn = false;

    /** @param {any} e */
    function handleConfirm(e) {
        e.preventDefault();
        confirm && confirm();
    }

    /** @param {any} e */
    function handleClose(e) {
        e.preventDefault();
        toggleModal && toggleModal();
    }

</script>


<Modal class={className} fade size={size} isOpen={isOpen} toggle={() => toggleModal()}>
    {#if !!title}
    <ModalHeader>{title}</ModalHeader>
    {/if}
    <ModalBody>
        <slot />
    </ModalBody>
    <ModalFooter>
        {#if !!confirmBtnText}
        <Button color="primary" on:click={(e) => handleConfirm(e)} disabled={disableConfirmBtn}>{confirmBtnText}</Button>
        {/if}

        {#if !!cancelBtnText}
        <Button color="secondary" on:click={(e) => handleClose(e)}>{cancelBtnText}</Button>
        {/if}
    </ModalFooter>
</Modal>