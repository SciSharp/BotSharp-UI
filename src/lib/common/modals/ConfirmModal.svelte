<script>
    import { fade, fly, scale } from 'svelte/transition';
    import { quintOut, backOut } from 'svelte/easing';

    /**
     * @typedef {'warning' | 'success' | 'error' | 'info' | 'question'} IconKind
     * @typedef {'primary' | 'danger' | 'warning' | 'success' | 'info'} BtnColor
     */

    let {
        isOpen = false,
        /** @type {IconKind} */
        icon = 'warning',
        title = '',
        text = '',
        confirmBtnText = 'Yes',
        cancelBtnText = 'No',
        /** @type {BtnColor | undefined} */
        confirmBtnColor = undefined,
        showCancelBtn = true,
        closeable = false,
        size = 'md',
        confirm = () => {},
        cancel = () => {},
        toggleModal = () => {}
    } = $props();

    /** @type {Record<string, string>} */
    const sizeWidths = {
        xs: '22rem',
        sm: '26rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem'
    };

    /** @type {Record<IconKind, { glyph: string, color: BtnColor }>} */
    const iconMap = {
        warning:  { glyph: 'mdi mdi-alert-outline',         color: 'warning' },
        success:  { glyph: 'mdi mdi-check-circle-outline',  color: 'success' },
        error:    { glyph: 'mdi mdi-close-circle-outline',  color: 'danger'  },
        info:     { glyph: 'mdi mdi-information-outline',   color: 'info'    },
        question: { glyph: 'mdi mdi-help-circle-outline',   color: 'primary' }
    };

    const iconInfo = $derived(iconMap[/** @type {IconKind} */ (icon)] || iconMap.warning);
    /** @type {BtnColor} */
    const btnColor = $derived(confirmBtnColor || iconInfo.color);

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

    /** @param {MouseEvent} e */
    function handleBackdropClick(e) {
        if (e.target === e.currentTarget && closeable) {
            toggleModal();
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
        class="cm-overlay"
        transition:fade={{ duration: 150 }}
        onclick={handleBackdropClick}
    >
        <div
            class={`cm-panel cm-tone-${iconInfo.color}`}
            style={`max-width: ${sizeWidths[size] || sizeWidths.sm};`}
            transition:fly={{ y: -16, duration: 220, easing: quintOut }}
            role="dialog"
            aria-modal="true"
        >
            <!-- Tone-matched accent strip across the very top edge. -->
            <div class="cm-accent"></div>

            {#if closeable}
                <button
                    type="button"
                    class="cm-close"
                    aria-label="Close"
                    onclick={() => toggleModal()}
                >
                    <i class="mdi mdi-close"></i>
                </button>
            {/if}

            <!-- Animated icon bubble: tone-coloured halo + pulsing ring. -->
            <div class="cm-icon-wrap" in:scale={{ duration: 350, easing: backOut, start: 0.4 }}>
                <span class="cm-icon-ring"></span>
                <span class="cm-icon-bubble">
                    <i class={iconInfo.glyph}></i>
                </span>
            </div>

            <div class="cm-body">
                {#if title}
                    <h3 class="cm-title">{title}</h3>
                {/if}
                {#if text}
                    <p class="cm-text">{text}</p>
                {/if}
            </div>

            <footer class="cm-footer">
                {#if showCancelBtn && cancelBtnText}
                    <button
                        type="button"
                        class="cm-btn cm-btn-cancel"
                        onclick={(e) => handleCancel(e)}
                    >
                        {cancelBtnText}
                    </button>
                {/if}
                {#if confirmBtnText}
                    <button
                        type="button"
                        class={`cm-btn cm-btn-confirm cm-btn-tone-${btnColor}`}
                        onclick={(e) => handleConfirm(e)}
                    >
                        {confirmBtnText}
                    </button>
                {/if}
            </footer>
        </div>
    </div>
{/if}

<style>
    /* ============================================================
       ConfirmModal — themed via Tailwind v4 tokens; mirrors the look
       of DialogModal / PlainModal / StateModal (backdrop blur, primary
       accent strip, layered shadow, dark mode) but is purpose-built
       for short confirm/alert prompts with a prominent animated icon.

       The `cm-tone-*` modifier on .cm-panel routes a single token
       (`--cm-tone`) through the accent strip + icon bubble; the
       `cm-btn-tone-*` modifier does the same for the confirm button,
       so callers can keep button colour and icon colour in sync (the
       default) or override them independently.
       ============================================================ */

    /* ---------- Tone tokens (icon bubble + accent strip) ---------- */
    .cm-tone-primary { --cm-tone: var(--color-primary); }
    .cm-tone-danger  { --cm-tone: var(--color-danger);  }
    .cm-tone-warning { --cm-tone: var(--color-warning); }
    .cm-tone-success { --cm-tone: var(--color-success); }
    .cm-tone-info    { --cm-tone: var(--color-info);    }

    /* ---------- Overlay ---------- */
    .cm-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 4rem 1rem 1rem;
        background-color: rgb(15 23 42 / 0.55);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        overflow-y: auto;
    }

    /* ---------- Panel ---------- */
    /* Width is set inline via `max-width` from the `size` prop's lookup
       in `sizeWidths`, mirroring DialogModal / PlainModal. */
    .cm-panel {
        position: relative;
        width: 100%;
        padding: 1.75rem 1.5rem 1.25rem;
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 1rem;
        box-shadow:
            0 25px 50px -12px rgb(15 23 42 / 0.3),
            0 12px 24px -8px color-mix(in srgb, var(--cm-tone) 22%, transparent),
            0 0 0 1px rgb(255 255 255 / 0.06) inset;
        overflow: hidden;
        text-align: center;
    }

    .cm-accent {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(
            90deg,
            var(--cm-tone) 0%,
            color-mix(in srgb, var(--cm-tone) 55%, white) 50%,
            var(--cm-tone) 100%
        );
    }

    /* ---------- Close button (only shown when closeable) ---------- */
    .cm-close {
        position: absolute;
        top: 0.625rem;
        right: 0.625rem;
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
    .cm-close:hover {
        background-color: rgb(243 244 246);
        color: var(--color-danger);
        transform: rotate(90deg);
    }
    .cm-close:focus-visible {
        outline: 2px solid var(--cm-tone);
        outline-offset: 2px;
    }

    /* ---------- Icon bubble + pulsing halo ---------- */
    .cm-icon-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 4.5rem;
        height: 4.5rem;
        margin: 0.25rem auto 1rem;
    }
    .cm-icon-bubble {
        position: relative;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 4.5rem;
        height: 4.5rem;
        border-radius: 999px;
        background: linear-gradient(
            145deg,
            color-mix(in srgb, var(--cm-tone) 18%, white) 0%,
            color-mix(in srgb, var(--cm-tone) 32%, white) 100%
        );
        color: var(--cm-tone);
        font-size: 2.25rem;
        line-height: 1;
        box-shadow:
            inset 0 0 0 1px color-mix(in srgb, var(--cm-tone) 25%, transparent),
            0 8px 20px -8px color-mix(in srgb, var(--cm-tone) 55%, transparent);
    }
    .cm-icon-ring {
        position: absolute;
        inset: -0.25rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--cm-tone) 18%, transparent);
        animation: cm-pulse 2s ease-out infinite;
    }
    @keyframes cm-pulse {
        0%   { transform: scale(0.85); opacity: 0.6; }
        70%  { transform: scale(1.25); opacity: 0;   }
        100% { transform: scale(1.25); opacity: 0;   }
    }
    @media (prefers-reduced-motion: reduce) {
        .cm-icon-ring { animation: none; }
    }

    /* ---------- Body (title + text) ---------- */
    .cm-body {
        padding: 0 0.25rem 0.25rem;
    }
    .cm-title {
        margin: 0 0 0.5rem;
        font-size: 1.25rem;
        font-weight: 600;
        line-height: 1.35;
        color: rgb(17 24 39);
        letter-spacing: -0.01em;
    }
    .cm-text {
        margin: 0;
        font-size: 0.9375rem;
        line-height: 1.55;
        color: rgb(75 85 99);
    }

    /* ---------- Footer + buttons ---------- */
    .cm-footer {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.625rem;
        margin-top: 1.5rem;
    }
    .cm-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 6rem;
        height: 2.5rem;
        padding: 0 1.25rem;
        border-radius: 0.625rem;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease,
            box-shadow 0.15s ease, transform 0.1s ease;
    }
    .cm-btn:active:not(:disabled) { transform: translateY(1px); }
    .cm-btn:focus-visible {
        outline: 2px solid var(--cm-tone);
        outline-offset: 2px;
    }
    .cm-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .cm-btn-cancel {
        border: 1px solid rgb(229 231 235);
        background-color: rgb(255 255 255);
        color: rgb(55 65 81);
    }
    .cm-btn-cancel:hover:not(:disabled) {
        background-color: rgb(243 244 246);
        border-color: rgb(209 213 219);
        color: rgb(17 24 39);
    }

    /* Confirm button — gradient + tone-matched shadow halo. */
    .cm-btn-confirm {
        --btn-tone: var(--color-primary);
        border: 1px solid var(--btn-tone);
        background-image: linear-gradient(
            180deg,
            color-mix(in srgb, var(--btn-tone) 92%, white) 0%,
            var(--btn-tone) 100%
        );
        color: rgb(255 255 255);
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.08),
            0 6px 16px -4px color-mix(in srgb, var(--btn-tone) 55%, transparent);
    }
    .cm-btn-confirm:hover:not(:disabled) {
        background-image: linear-gradient(
            180deg,
            var(--btn-tone) 0%,
            color-mix(in srgb, var(--btn-tone) 80%, black) 100%
        );
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.12),
            0 10px 24px -4px color-mix(in srgb, var(--btn-tone) 60%, transparent);
    }
    .cm-btn-tone-primary { --btn-tone: var(--color-primary); }
    .cm-btn-tone-danger  { --btn-tone: var(--color-danger);  }
    .cm-btn-tone-warning { --btn-tone: var(--color-warning); }
    .cm-btn-tone-success { --btn-tone: var(--color-success); }
    .cm-btn-tone-info    { --btn-tone: var(--color-info);    }

    /* ---------- Dark mode ---------- */
    :global(.dark) .cm-overlay { background-color: rgb(0 0 0 / 0.65); }
    :global(.dark) .cm-panel {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .cm-title { color: rgb(243 244 246); }
    :global(.dark) .cm-text  { color: rgb(209 213 219); }
    :global(.dark) .cm-btn-cancel {
        background-color: rgb(55 65 81);
        border-color: rgb(75 85 99);
        color: rgb(229 231 235);
    }
    :global(.dark) .cm-btn-cancel:hover:not(:disabled) {
        background-color: rgb(75 85 99);
        border-color: rgb(107 114 128);
    }
    :global(.dark) .cm-close:hover {
        background-color: rgb(55 65 81);
    }
</style>

