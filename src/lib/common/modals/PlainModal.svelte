<script>
    import { Modal, ModalBody, ModalHeader } from "@sveltestrap/sveltestrap";

    /** @type {boolean} */
    export let isOpen;

    /** @type {string} */
    export let size = 'lg';

    /** @type {string | any} */
    export let title;

    /** @type {string} */
    export let containerClasses = '';

    /** @type {string} */
    export let containerStyles = '';

    /** @type {() => void} */
    export let toggleModal;
</script>

<Modal
    class={containerClasses}
    style={containerStyles}
    fade
    size={size}
    isOpen={isOpen}
    header={title}
    toggle={() => toggleModal()}
    unmountOnClose
>
    <ModalBody>
        <slot />
    </ModalBody>
</Modal>