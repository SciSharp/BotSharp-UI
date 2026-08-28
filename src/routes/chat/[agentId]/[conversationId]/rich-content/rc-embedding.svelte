<script>
    import collapse from 'svelte-collapse';

    const collapseDuration = 0.3;

    /**
     * @type {{
     *   url?: string,
     *   title?: string,
     *   htmlTag?: string
     * }}
     */
    let {
        url = '',
        title = '',
        htmlTag = ''
    } = $props();

    let open = $state(false);

    /** @type {HTMLDivElement | null} */
    let wrapperEl = $state(null);

    function toggleCollapse() {
        open = !open;
        if (open) {
            // Bring the expanded embed into view once the collapse animation has
            // settled. `block: 'nearest'` scrolls only as far as needed, so a
            // message in the middle of the thread stays put instead of the whole
            // pane jumping to the bottom.
            setTimeout(() => {
                wrapperEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }, collapseDuration * 1000);
        }
    }
</script>

{#if htmlTag && url}
    <div class="rc-embedding-wrapper" bind:this={wrapperEl}>
        <div class="rc-embedding-toggle-group">
            <button type="button" class="rc-embedding-toggle" class:closed={!open} onclick={toggleCollapse}>
                <span>{open ? 'Close' : 'Open'}{title ? ` ${title}` : ''}</span>
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" class="rc-embedding-link" title="Open in new tab">
                <i class="bx bx-link-external"></i>
            </a>
        </div>
        <div class="rc-embedding-collapse" use:collapse={{ open, duration: collapseDuration, easing: 'ease' }}>
            {#if open}
            <div class="rc-embedding-container">
                {#if htmlTag === 'iframe'}
                    <iframe
                        class="rc-embedding-iframe"
                        src={url}
                        title={title || ''}
                        frameborder="0"
                        allowfullscreen
                        referrerpolicy="no-referrer"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    ></iframe>
                {/if}
            </div>
            {/if}
        </div>
    </div>
{/if}



