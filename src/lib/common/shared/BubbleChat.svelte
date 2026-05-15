<script>
    /** @type {{ text: string, containerClasses?: string, containerStyles?: string, disableDefaultStyles?: boolean, close?: () => void }} */
    let {
        text,
        containerClasses = "",
        containerStyles = "",
        disableDefaultStyles = false,
        close = () => {}
    } = $props();

    /** @param {Event} e */
    function handleClose(e) {
        e.preventDefault();
        close?.();
    }
</script>

<div
    class="{disableDefaultStyles ? '' : 'bc-container'} {containerClasses}"
    style={`${containerStyles}`}
>
    <div class="bc-bubble">
        <div
            class="bc-delete cursor-pointer"
            role="button"
            tabindex="0"
            onclick={handleClose}
            onkeydown={e => e.key === 'Enter' && handleClose(e)}
        >
            <i class="mdi mdi-close"></i>
        </div>
        <div class="bc-text">
            {text}
        </div>
    </div>
</div>

<style>
    /* Ported from src/lib/scss/custom/components/_chat.scss (now removed)
       and polished into a glass-card aesthetic. Used by LiveChatEntry to
       surface transient assistant notifications above the floating
       chatbot icon on the bottom-right of the viewport. */
    .bc-container {
        display: flex;
        flex-direction: column;
    }

    /* The bubble itself. A diagonal gradient (lighter top-left → darker
       bottom-right) gives depth without losing the primary tint; a faint
       white inset highlight at the top edge plus a layered shadow
       (primary-tinted glow + neutral drop) make the bubble feel like
       it's floating above the page. All tints derive from
       `var(--color-primary)` so the bubble re-themes automatically when
       PUBLIC_PRIMARY_COLOR is overridden in +layout.svelte. */
    .bc-bubble {
        position: relative;
        margin: 5px 30px 0 5px;
        min-width: 200px;
        max-width: 300px;
        background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--color-primary) 95%, white 5%) 0%,
            color-mix(in srgb, var(--color-primary) 85%, black 15%) 100%
        );
        color: white;
        border: 1px solid color-mix(in srgb, white 18%, transparent);
        border-radius: 14px;
        box-shadow:
            0 12px 28px -8px color-mix(in srgb, var(--color-primary) 45%, transparent),
            0 4px 10px -2px rgb(0 0 0 / 0.08),
            inset 0 1px 0 color-mix(in srgb, white 18%, transparent);
    }

    /* Symmetric downward-pointing tail anchored on the right so it
       visually angles toward the chatbot icon below. The fill matches
       the bubble's bottom-gradient color so the tail reads as a smooth
       continuation of the bubble surface. */
    .bc-bubble::after {
        content: "";
        position: absolute;
        top: 100%;
        right: 40px;
        width: 18px;
        height: 10px;
        background-color: color-mix(in srgb, var(--color-primary) 85%, black 15%);
        clip-path: polygon(0 0, 50% 100%, 100% 0);
    }

    /* Notification body. Extra right margin clears the absolute-positioned
       close button so longer text never runs underneath it. */
    .bc-text {
        margin: 14px 36px 16px 18px;
        font-size: 0.875rem;
        line-height: 1.55;
        height: fit-content;
        max-height: 100px;
        overflow-y: auto;
        scrollbar-width: none;
    }
    .bc-text::-webkit-scrollbar {
        display: none;
    }

    /* Close button — small rounded hit area with a subtle hover pill so
       the icon doesn't compete with the message text in the resting
       state but still feels interactive on hover/focus. */
    .bc-delete {
        position: absolute;
        top: 4px;
        right: 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        color: color-mix(in srgb, white 80%, transparent);
        line-height: 1;
        transition: background-color 150ms ease, color 150ms ease;
    }
    .bc-delete:hover {
        background-color: color-mix(in srgb, white 18%, transparent);
        color: white;
    }
    .bc-delete:focus-visible {
        outline: 2px solid white;
        outline-offset: 1px;
    }
    .bc-delete > :global(i) {
        font-size: 16px;
    }
</style>
