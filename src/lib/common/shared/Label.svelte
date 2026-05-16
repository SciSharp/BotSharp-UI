<script>
    let {
        text = "",
        className = "",
        style = "",
        /** One of: primary | secondary | success | info | warning | danger */
        color = "primary",
        ellipsis = false,
        /** @type {string | number} */
        index,
        /** @type {(args0: number | string) => void} */
        onClose = () => {}
    } = $props();

    /**
     * @param {any} e
     * @param {string | number} idx
     */
    function handleClose(e, idx) {
        e.preventDefault();
        e.stopPropagation();
        onClose?.(idx);
    }
</script>

<span class={`cl-chip cl-chip-${color} ${className}`} style={style}>
    <span class={`cl-text ${ellipsis ? 'cl-ellipsis' : ''}`}>
        {text}
    </span>
    <button
        type="button"
        class="cl-close"
        aria-label={`Remove ${text}`}
        title="Remove"
        onclick={(e) => handleClose(e, index)}
    >
        <i class="mdi mdi-close"></i>
    </button>
</span>


<style>
    .cl-chip {
        display: inline-flex;
        align-items: center;
        align-self: center;
        gap: 0.25rem;
        padding: 0.1875rem 0.25rem 0.1875rem 0.625rem;
        font-size: 0.75rem;
        font-weight: 600;
        line-height: 1;
        letter-spacing: 0.01em;
        border: 1px solid transparent;
        border-radius: 999px;
        background-color: transparent;
        vertical-align: middle;
        max-width: 100%;
        transition: background-color 0.15s ease, border-color 0.15s ease;
    }

    .cl-text {
        flex: 0 1 auto;
        min-width: 0;
    }

    /* When ellipsis is requested, cap width and truncate.
       Otherwise the chip grows with its content. */
    .cl-ellipsis {
        max-width: 10rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* Close button — inherits the chip's color so the X reads as part
       of the same tint family. Hover gives it a subtle dimmer pill so
       users can see it's interactive without breaking the chip's look. */
    .cl-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 1.125rem;
        height: 1.125rem;
        padding: 0;
        margin: 0;
        background-color: transparent;
        border: 0;
        border-radius: 999px;
        color: inherit;
        opacity: 0.65;
        cursor: pointer;
        transition: background-color 0.15s ease, opacity 0.12s ease, transform 0.12s ease;
    }
    .cl-close:hover {
        opacity: 1;
        background-color: rgb(0 0 0 / 0.1);
    }
    .cl-close:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 1px;
        opacity: 1;
    }
    .cl-close:active {
        transform: scale(0.9);
    }
    .cl-close i {
        font-size: 0.875rem;
        line-height: 1;
    }

    /* Color variants — soft tinted bg, same-color text + border.
       Uses color-mix so the chip's tone shifts automatically when the
       deployment's PUBLIC_PRIMARY_COLOR overrides --color-primary. */
    .cl-chip-primary {
        background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
        border-color:     color-mix(in srgb, var(--color-primary) 30%, transparent);
        color: var(--color-primary);
    }
    .cl-chip-secondary {
        background-color: color-mix(in srgb, var(--color-secondary) 12%, transparent);
        border-color:     color-mix(in srgb, var(--color-secondary) 30%, transparent);
        color: var(--color-secondary);
    }
    .cl-chip-success {
        background-color: color-mix(in srgb, var(--color-success) 14%, transparent);
        border-color:     color-mix(in srgb, var(--color-success) 32%, transparent);
        color: var(--color-success);
    }
    .cl-chip-info {
        background-color: color-mix(in srgb, var(--color-info) 14%, transparent);
        border-color:     color-mix(in srgb, var(--color-info) 32%, transparent);
        color: var(--color-info);
    }
    /* Warning yellow has poor contrast as text — darken it slightly for
       readability while keeping the bg/border in the warning family. */
    .cl-chip-warning {
        background-color: color-mix(in srgb, var(--color-warning) 16%, transparent);
        border-color:     color-mix(in srgb, var(--color-warning) 35%, transparent);
        color: color-mix(in srgb, var(--color-warning), black 28%);
    }
    .cl-chip-danger {
        background-color: color-mix(in srgb, var(--color-danger) 14%, transparent);
        border-color:     color-mix(in srgb, var(--color-danger) 32%, transparent);
        color: var(--color-danger);
    }

    /* Dark mode: bump the bg/border tint so chips remain legible on a
       dark panel; text color stays the same. Close-button hover scrim
       flips to a light overlay since black-on-dark is invisible. */
    :global(.dark) .cl-chip-primary,
    :global(.dark) .cl-chip-secondary,
    :global(.dark) .cl-chip-success,
    :global(.dark) .cl-chip-info,
    :global(.dark) .cl-chip-warning,
    :global(.dark) .cl-chip-danger {
        background-color: color-mix(in srgb, currentColor 18%, transparent);
        border-color:     color-mix(in srgb, currentColor 38%, transparent);
    }
    :global(.dark) .cl-close:hover {
        background-color: rgb(255 255 255 / 0.18);
    }
</style>