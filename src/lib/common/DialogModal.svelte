<script>
    import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@sveltestrap/sveltestrap";

    /** @type {boolean} */
    export let isOpen;

    /** @type {boolean} */
    export let closeable = false;

    /** @type {string} */
    export let size = 'xl';

    /** @type {string | any} */
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
    export let confirm = () => {};

    /** @type {() => void} */
    export let cancel = () => {};

    /** @type {() => void} */
    export let close = () => {};

    /** @type {boolean} */
    export let disableConfirmBtn = false;

    /** @param {any} e */
    function handleConfirm(e) {
        e.preventDefault();
        confirm && confirm();
    }

    /** @param {any} e */
    function handleCancel(e) {
        e.preventDefault();
        cancel && cancel();
    }

    /** @param {any} e */
    function handleClose(e) {
        e.preventDefault();
        close && close();
    }
</script>


<Modal
    class={`dialog-modal-container ${className}`}
    fade
    size={size}
    isOpen={isOpen}
    toggle={() => toggleModal()}
    unmountOnClose
>
    <ModalHeader>
        <div class="dialog-modal-header">
            {#if !!title}
                <div class="header-title">
                    <slot name='title-icon'/>
                    <div>{title}</div>
                </div>
            {/if}
            {#if closeable}
                <div class="header-close">
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div
                        class="clickable"
                        on:click={e => handleClose(e)}
                    >
                        <i class="mdi mdi-close" />
                    </div>
                </div>
            {/if}
        </div>
    </ModalHeader>
    <ModalBody>
        <slot />
    </ModalBody>
    <ModalFooter>
        {#if !!confirmBtnText}
        <Button color="primary" on:click={(e) => handleConfirm(e)} disabled={disableConfirmBtn}>{confirmBtnText}</Button>
        {/if}

        {#if !!cancelBtnText}
        <Button color="secondary" on:click={(e) => handleCancel(e)}>{cancelBtnText}</Button>
        {/if}
    </ModalFooter>
</Modal>