<script>
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    let {
        isOpen = false,
        size = 'xl',
        title = '',
        containerClasses = '',
        containerStyles = '',
        bodyStyles = '',
        toggleModal = () => {},
        children
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
        class={`pm-overlay ${containerClasses}`}
        transition:fade={{ duration: 150 }}
        onclick={handleBackdropClick}
    >
        <div
            class="pm-panel modal-content"
            style={`max-width: ${sizeWidths[size] || sizeWidths.xl}; ${containerStyles}`}
            transition:fly={{ y: -16, duration: 200, easing: quintOut }}
            role="dialog"
            aria-modal="true"
        >
            <!-- Primary accent strip — same branded edge as DialogModal. -->
            <div class="pm-accent"></div>

            {#if title}
                <header class="pm-header modal-title">
                    <div class="pm-title">{title}</div>
                    <button
                        type="button"
                        class="pm-close"
                        aria-label="Close"
                        onclick={() => toggleModal()}
                    >
                        <i class="mdi mdi-close"></i>
                    </button>
                </header>
            {/if}

            <div class="pm-body modal-body" style={bodyStyles}>
                {@render children?.()}
            </div>
        </div>
    </div>
{/if}

<style>
    /* ============================================================
       PlainModal — self-contained, themed via Tailwind v4 tokens.
       Mirrors DialogModal's look (backdrop blur, primary accent strip,
       layered shadow) but without the action footer. The legacy
       `.modal-content` / `.modal-title` / `.modal-body` class names are
       kept on the markup for backwards-compat with any external
       `:global()` overrides that pre-date the migration.
       ============================================================ */

    .pm-overlay {
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

    .pm-panel {
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

    .pm-accent {
        height: 3px;
        background: linear-gradient(
            90deg,
            var(--color-primary) 0%,
            color-mix(in srgb, var(--color-primary) 60%, white) 50%,
            var(--color-primary) 100%
        );
    }

    /* ---------- Header ---------- */
    .pm-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid rgb(243 244 246);
    }
    .pm-title {
        font-size: 1.0625rem;
        font-weight: 600;
        line-height: 1.4;
        color: rgb(17 24 39);
        min-width: 0;
        flex: 1 1 auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .pm-close {
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
    .pm-close:hover {
        background-color: rgb(243 244 246);
        color: var(--color-danger);
        transform: rotate(90deg);
    }
    .pm-close:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }

    /* ---------- Body ---------- */
    .pm-body {
        padding: 1.25rem;
        font-size: 0.875rem;
        line-height: 1.6;
        color: rgb(31 41 55);
        max-height: calc(90vh - 6rem);
        overflow-y: auto;
        scrollbar-width: thin;
    }

    /* ---------- Dark mode ---------- */
    :global(.dark) .pm-overlay {
        background-color: rgb(0 0 0 / 0.65);
    }
    :global(.dark) .pm-panel {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .pm-header {
        border-color: rgb(55 65 81);
    }
    :global(.dark) .pm-title {
        color: rgb(243 244 246);
    }
    :global(.dark) .pm-body {
        color: rgb(229 231 235);
    }
</style>