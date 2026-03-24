<script>
    import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@sveltestrap/sveltestrap";

    let {
        isOpen = false,
        closeable = false,
        size = 'xl',
        title = '',
        className = '',
        confirmBtnText = 'Confirm',
        cancelBtnText = 'Cancel',
        toggleModal = () => {},
        confirm = () => {},
        cancel = () => {},
        close = () => {},
        disableConfirmBtn = false
    } = $props();

    /** @param {any} e */
    function handleConfirm(e) {
        e.preventDefault();
        confirm?.();
    }

    /** @param {any} e */
    function handleCancel(e) {
        e.preventDefault();
        cancel?.();
    }

    /** @param {any} e */
    function handleClose(e) {
        e.preventDefault();
        close?.();
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
                        onclick={e => handleClose(e)}
                    >
                        <i class="mdi mdi-close"></i>
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