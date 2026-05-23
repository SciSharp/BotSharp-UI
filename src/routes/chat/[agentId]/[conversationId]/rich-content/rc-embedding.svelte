<script>
    import { getContext } from 'svelte';
    import collapse from 'svelte-collapse';

    const collapseDuration = 0.3;
    const { autoScrollToBottom } = getContext('chat-window-context');

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
        if (open) {
            setTimeout(() => autoScrollToBottom?.(), collapseDuration * 1000);
        }
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



