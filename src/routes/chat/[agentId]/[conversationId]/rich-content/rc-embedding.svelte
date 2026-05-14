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

<style>
    /* Outer flex column (replaces global _rich_content.scss .rc-embedding-wrapper) */
    .rc-embedding-wrapper {
        width: 100%;
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    /* Toggle row with the open/close pill + external link icon */
    .rc-embedding-toggle-group {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    /* External-link icon */
    .rc-embedding-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--color-info, #50a5f1);
        font-size: 16px;
        transition: color 0.2s ease;
        text-decoration: none;
    }
    .rc-embedding-link:hover {
        color: color-mix(in srgb, var(--color-info, #50a5f1) 70%, black 30%);
    }

    /* Open/close pill — danger (red) when open, success (green) when closed */
    .rc-embedding-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin: 0 auto;
        width: auto;
        background: linear-gradient(135deg, rgb(244 106 106 / 0.08), rgb(244 106 106 / 0.15));
        border: 1px solid rgb(244 106 106 / 0.2);
        border-radius: 20px;
        cursor: pointer;
        padding: 6px 16px;
        font-size: 13px;
        font-weight: 500;
        color: var(--color-danger, #f46a6a);
        user-select: none;
        transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
        backdrop-filter: blur(4px);
    }
    .rc-embedding-toggle:hover {
        background: linear-gradient(135deg, rgb(244 106 106 / 0.15), rgb(244 106 106 / 0.25));
        border-color: rgb(244 106 106 / 0.4);
        box-shadow: 0 2px 8px rgb(244 106 106 / 0.2);
        transform: translateY(-1px);
    }
    .rc-embedding-toggle:active {
        transform: translateY(0);
        box-shadow: none;
    }
    .rc-embedding-toggle.closed {
        background: linear-gradient(135deg, rgb(52 195 143 / 0.08), rgb(52 195 143 / 0.15));
        border-color: rgb(52 195 143 / 0.2);
        color: var(--color-success, #34c38f);
    }
    .rc-embedding-toggle.closed:hover {
        background: linear-gradient(135deg, rgb(52 195 143 / 0.15), rgb(52 195 143 / 0.25));
        border-color: rgb(52 195 143 / 0.4);
        box-shadow: 0 2px 8px rgb(52 195 143 / 0.2);
    }

    /* Collapsible iframe wrapper (replaces inline style="width:100%;margin-top:8px") */
    .rc-embedding-collapse {
        width: 100%;
        margin-top: 8px;
    }

    /* iframe container */
    .rc-embedding-container {
        width: 100%;
        border-radius: 8px;
        display: flex;
        justify-content: center;
        overflow: auto;
        scrollbar-width: thin;
    }
    .rc-embedding-iframe {
        width: fit-content;
        min-width: 100%;
        max-height: 800px;
        min-height: 500px;
        border: 1px solid var(--color-border, #dee2e6);
        border-radius: 8px;
    }
</style>

