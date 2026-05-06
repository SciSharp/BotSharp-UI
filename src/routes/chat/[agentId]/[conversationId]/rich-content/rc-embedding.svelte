<script>
    import collapse from 'svelte-collapse';

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

    function toggleCollapse() {
        open = !open;
    }
</script>

{#if htmlTag && url}
    <div class="rc-embedding-wrapper">
        <div class="rc-embedding-toggle-group">
            <button type="button" class="rc-embedding-toggle" class:closed={!open} onclick={toggleCollapse}>
                <span>{open ? 'Close' : 'Open'}{title ? ` ${title}` : ''}</span>
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" class="rc-embedding-link" title="Open in new tab">
                <i class="bx bx-link-external"></i>
            </a>
        </div>
        <div use:collapse={{ open, duration: 0.3, easing: 'ease' }} style="width: 100%; margin-top: 8px;">
            <div class="rc-embedding-container">
                {#if htmlTag === 'iframe'}
                    <iframe
                        src={url}
                        title={title || ''}
                        frameborder="0"
                        allowfullscreen
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        class="rc-embedding-iframe"
                    ></iframe>
                {/if}
            </div>
        </div>
    </div>
{/if}

