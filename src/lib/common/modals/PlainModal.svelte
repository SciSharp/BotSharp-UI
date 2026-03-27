<script>
    import { fade } from 'svelte/transition';

    let {
        isOpen = false,
        size = 'lg',
        title = '',
        containerClasses = '',
        containerStyles = '',
        bodyStyles = '',
        toggleModal = () => {},
        children
    } = $props();

    /** @type {Record<string, string>} */
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl'
    };

    /** @param {MouseEvent} e */
    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            toggleModal();
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] bg-black/50"
    transition:fade={{ duration: 150 }}
    onclick={handleBackdropClick}
>
    <div
        class={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size] || 'max-w-lg'} mx-4 ${containerClasses}`}
        style={containerStyles}
    >
        <!-- Header -->
        {#if title}
        <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <div class="font-semibold text-lg">{title}</div>
            <button
                type="button"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                aria-label="Close"
                onclick={() => toggleModal()}
            >
                <i class="mdi mdi-close text-xl"></i>
            </button>
        </div>
        {/if}

        <!-- Body -->
        <div class="p-3" style={bodyStyles}>
            {@render children?.()}
        </div>
    </div>
</div>
{/if}