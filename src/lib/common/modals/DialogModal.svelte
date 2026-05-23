<script>
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

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
        disableConfirmBtn = false,
        children,
        titleIcon = undefined
    } = $props();

    /** @type {Record<string, string>} */
    const sizeWidths = {
        sm: '24rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem'
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
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
        class="dm-overlay"
        transition:fade={{ duration: 150 }}
        onclick={handleBackdropClick}
    >
        <div
            class={`dm-panel dialog-modal-container ${className}`}
            style={`max-width: ${sizeWidths[size] || sizeWidths.xl};`}
            transition:fly={{ y: -16, duration: 200, easing: quintOut }}
            role="dialog"
            aria-modal="true"
        >
            <!-- Primary accent strip — gives the panel a subtle branded edge. -->
            <div class="dm-accent"></div>

            {#if !!title || closeable}
                <header class="dm-header">
                    {#if !!title}
                        <div class="dm-title">
                            {@render titleIcon?.()}
                            <span>{title}</span>
                        </div>
                    {/if}
                    {#if closeable}
                        <button
                            type="button"
                            class="dm-close"
                            aria-label="Close"
                            onclick={(e) => handleClose(e)}
                        >
                            <i class="mdi mdi-close"></i>
                        </button>
                    {/if}
                </header>
            {/if}

            <div class="dm-body">
                {@render children?.()}
            </div>

            {#if !!confirmBtnText || !!cancelBtnText}
                <footer class="dm-footer">
                    {#if !!cancelBtnText}
                        <button
                            type="button"
                            class="dm-btn dm-btn-cancel"
                            onclick={(e) => handleCancel(e)}
                        >
                            {cancelBtnText}
                        </button>
                    {/if}
                    {#if !!confirmBtnText}
                        <button
                            type="button"
                            class="dm-btn dm-btn-confirm"
                            onclick={(e) => handleConfirm(e)}
                            disabled={disableConfirmBtn}
                        >
                            {confirmBtnText}
                        </button>
                    {/if}
                </footer>
            {/if}
        </div>
    </div>
{/if}

<style>
    /* ============================================================
       DialogModal — self-contained, themed via Tailwind v4 tokens.
       No Bootstrap classes; uses `var(--color-primary)` / `--color-muted`
       so the design follows the runtime theme.
       ============================================================ */

    .dm-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 3rem 1rem 1rem;
        background-color: rgb(15 23 42 / 0.55);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        overflow-y: auto;
    }

    .dm-panel {
        position: relative;
        width: 100%;
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.75rem;
        box-shadow:
            0 25px 50px -12px rgb(15 23 42 / 0.25),
            0 12px 24px -8px color-mix(in srgb, var(--color-primary) 18%, transparent),
            0 0 0 1px rgb(255 255 255 / 0.06) inset;
        overflow: hidden;
    }

    /* 3px primary gradient strip across the very top edge of the panel. */
    .dm-accent {
        height: 3px;
        background: linear-gradient(
            90deg,
            var(--color-primary) 0%,
            color-mix(in srgb, var(--color-primary) 60%, white) 50%,
            var(--color-primary) 100%
        );
    }

    /* ---------- Header ---------- */
    .dm-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid rgb(243 244 246);
    }
    .dm-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.0625rem;
        font-weight: 600;
        line-height: 1.4;
        color: rgb(17 24 39);
        min-width: 0;
        flex: 1 1 auto;
    }
    .dm-title :global(i),
    .dm-title :global(svg) {
        flex-shrink: 0;
        color: var(--color-primary);
    }
    .dm-title > span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .dm-close {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0.5rem;
        background: transparent;
        color: rgb(156 163 175);
        font-size: 1.125rem;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease, transform 0.2s ease;
    }
    .dm-close:hover {
        background-color: rgb(243 244 246);
        color: var(--color-danger);
        transform: rotate(90deg);
    }
    .dm-close:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }

    /* ---------- Body ---------- */
    .dm-body {
        padding: 1.25rem;
        font-size: 0.875rem;
        line-height: 1.6;
        color: rgb(31 41 55);
        max-height: calc(85vh - 8rem);
        overflow-y: auto;
        scrollbar-width: thin;
    }

    /* ---------- Footer + buttons ---------- */
    .dm-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.5rem;
        padding: 0.875rem 1.25rem;
        border-top: 1px solid rgb(243 244 246);
        background-color: rgb(249 250 251);
    }

    .dm-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 5.5rem;
        height: 2.25rem;
        padding: 0 1rem;
        border-radius: 0.5rem;
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1;
        cursor: pointer;
        transition:
            background-color 0.15s ease,
            border-color 0.15s ease,
            color 0.15s ease,
            box-shadow 0.15s ease,
            transform 0.1s ease;
    }
    .dm-btn:active:not(:disabled) {
        transform: translateY(1px);
    }
    .dm-btn:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }
    .dm-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }

    .dm-btn-cancel {
        border: 1px solid rgb(229 231 235);
        background-color: rgb(255 255 255);
        color: rgb(55 65 81);
    }
    .dm-btn-cancel:hover:not(:disabled) {
        background-color: rgb(243 244 246);
        border-color: rgb(209 213 219);
        color: rgb(17 24 39);
    }

    .dm-btn-confirm {
        border: 1px solid var(--color-primary);
        background-color: var(--color-primary);
        color: rgb(255 255 255);
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.08),
            0 4px 12px -4px color-mix(in srgb, var(--color-primary) 50%, transparent);
    }
    .dm-btn-confirm:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.12),
            0 8px 20px -4px color-mix(in srgb, var(--color-primary) 55%, transparent);
    }

    /* ---------- Dark mode ---------- */
    :global(.dark) .dm-overlay {
        background-color: rgb(0 0 0 / 0.65);
    }
    :global(.dark) .dm-panel {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .dm-header,
    :global(.dark) .dm-footer {
        border-color: rgb(55 65 81);
    }
    :global(.dark) .dm-footer {
        background-color: rgb(17 24 39);
    }
    :global(.dark) .dm-title {
        color: rgb(243 244 246);
    }
    :global(.dark) .dm-body {
        color: rgb(229 231 235);
    }
    :global(.dark) .dm-btn-cancel {
        background-color: rgb(55 65 81);
        border-color: rgb(75 85 99);
        color: rgb(229 231 235);
    }
    :global(.dark) .dm-btn-cancel:hover:not(:disabled) {
        background-color: rgb(75 85 99);
        border-color: rgb(107 114 128);
    }
</style>