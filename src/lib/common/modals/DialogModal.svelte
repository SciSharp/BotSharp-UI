<script>
    import { fade } from 'svelte/transition';

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

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl'
    };

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

    /** @param {MouseEvent} e */
    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            toggleModal();
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    class="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50"
    transition:fade={{ duration: 150 }}
    onclick={handleBackdropClick}
>
    <div class={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size] || 'max-w-xl'} mx-4 dialog-modal-container ${className}`}>
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {#if !!title}
                <div class="flex items-center gap-2 font-semibold text-lg">
                    <slot name='title-icon'/>
                    <div>{title}</div>
                </div>
            {/if}
            {#if closeable}
                <button
                    type="button"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                    aria-label="Close"
                    onclick={e => handleClose(e)}
                >
                    <i class="mdi mdi-close text-xl"></i>
                </button>
            {/if}
        </div>

        <!-- Body -->
        <div class="p-3">
            <slot />
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
            {#if !!confirmBtnText}
            <button
                type="button"
                class="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onclick={(e) => handleConfirm(e)}
                disabled={disableConfirmBtn}
            >
                {confirmBtnText}
            </button>
            {/if}

            {#if !!cancelBtnText}
            <button
                type="button"
                class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                onclick={(e) => handleCancel(e)}
            >
                {cancelBtnText}
            </button>
            {/if}
        </div>
    </div>
</div>
{/if}