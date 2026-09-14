<script>
    /**
     * Clips long content down to `lines` lines and offers the rest back, either
     * from the toggle underneath or from a click anywhere in the block.
     *
     * Wraps the content rather than replacing its markup, so a caller keeps
     * whatever box it already had — a chat bubble, a log panel row, a dialog
     * entry. The fade on the cut edge is what makes that work: a hard clip would
     * slice a bubble's rounded corners flat and read as a rendering bug, and a
     * painted '...' would have to know the background colour behind it, which
     * changes with the theme. A mask paints nothing, so it is right in both.
     *
     * @type {{
     *   lines?: number,
     *   slackLines?: number,
     *   padding?: number,
     *   align?: 'start' | 'end',
     *   enabled?: boolean,
     *   containerClasses?: string,
     *   children?: import('svelte').Snippet
     * }}
     */
    let {
        /** How many lines stay visible while the content is collapsed. */
        lines = 10,
        /**
         * How many lines past `lines` the content has to run before collapsing is
         * worth it. Without the margin, something a line or two over the limit
         * would put almost nothing behind a toggle.
         */
        slackLines = 2,
        /**
         * Vertical padding of the wrapped box, when the padding sits inside the
         * measured height — a chat bubble pads itself, so without this the clip
         * would land on the padding and show a line less than asked for.
         */
        padding = 0,
        /** `end` for right-aligned content, `start` for everything else. */
        align = 'start',
        /**
         * False leaves the content at full height: for a message still streaming
         * in, or for a caller that only collapses some of what it renders.
         */
        enabled = true,
        containerClasses = '',
        children
    } = $props();

    const contentId = $props.id();

    /**
     * Used when the computed line-height reads `normal`. Text in these surfaces
     * runs at about 1.55, so the browser's ~1.2 would cut it short of `lines`.
     */
    const FALLBACK_LINE_HEIGHT_RATIO = 1.55;

    let collapsed = $state(true);
    let isOverflowing = $state(false);
    let lineHeight = $state(24);
    /** @type {HTMLElement | undefined} */
    let contentEl = $state();

    let isCollapsible = $derived(enabled && isOverflowing);
    let maxHeight = $derived(Math.round(lines * lineHeight + padding));

    /**
     * Measured rather than hard-coded in px, so the cut stays at `lines` lines
     * whatever the reader's text size is.
     * @param {HTMLElement} el
     */
    function resolveLineHeight(el) {
        const cs = getComputedStyle(el);
        const lh = parseFloat(cs.lineHeight);
        if (Number.isFinite(lh) && lh > 0) {
            return lh;
        }
        return parseFloat(cs.fontSize) * FALLBACK_LINE_HEIGHT_RATIO || 24;
    }

    $effect(() => {
        const el = contentEl;
        if (!el) return;

        const measure = () => {
            const lh = resolveLineHeight(el);
            lineHeight = lh;
            isOverflowing = el.scrollHeight > lh * (lines + slackLines) + padding;
        };
        measure();
        // Markdown, images and streamed text all settle their height after the
        // first paint, so a one-shot measurement would misjudge most content.
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    });

    /**
     * Toggle from a click anywhere in the block, while leaving the normal
     * interactions inside it intact.
     * @param {MouseEvent} e
     */
    function handleClick(e) {
        if (!isCollapsible) return;

        const target = /** @type {HTMLElement | null} */ (e.target);
        // Links, buttons and form controls inside the content keep their own click.
        if (target?.closest('a, button, input, textarea, select')) return;
        // Selecting text is not a request to fold it away.
        if (window.getSelection()?.toString()) return;

        collapsed = !collapsed;
    }

    /** @param {MouseEvent} e */
    function toggle(e) {
        e.preventDefault();
        e.stopPropagation();
        collapsed = !collapsed;
    }
</script>


<div class={`ctxt ${containerClasses}`} class:ctxt-end={align === 'end'}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
        id={contentId}
        class="ctxt-view"
        class:ctxt-view-collapsed={isCollapsible && collapsed}
        class:ctxt-view-clickable={isCollapsible}
        style={`--ctxt-max-height: ${maxHeight}px;`}
        onclick={handleClick}
    >
        <div bind:this={contentEl} class="ctxt-content">
            {@render children?.()}
        </div>
    </div>

    {#if isCollapsible}
        <!--
            The click target above is a convenience for the mouse; this is the
            control, so the toggle is reachable and announced for keyboard and
            screen-reader users too.
        -->
        <button
            type="button"
            class="ctxt-toggle"
            aria-expanded={!collapsed}
            aria-controls={contentId}
            onclick={(e) => toggle(e)}
        >
            <i class={`mdi ${collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'}`} aria-hidden="true"></i>
            <span>{collapsed ? 'Show more' : 'Show less'}</span>
        </button>
    {/if}
</div>
