<script>
	import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@sveltestrap/sveltestrap";

    /** @type {boolean} */
    export let isOpen;

    /** @type {string} */
    export let size = 'xl';

    /** @type {() => void} */
    export let toggleModal;

    /** @type {() => void} */
    export let confirm;

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


<Modal class="custom-modal" fade size={size} isOpen={isOpen} toggle={() => toggleModal()}>
    <ModalHeader>Add states</ModalHeader>
    <ModalBody>
		<div>test 123</div>
    </ModalBody>
    <ModalFooter>
      <Button color="primary" on:click={(e) => handleConfirm(e)}>Confirm</Button>
      <Button color="secondary" on:click={(e) => handleClose(e)}>Cancel</Button>
    </ModalFooter>
</Modal>