<script>
    import { onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import MessageStateLogElement from './message-state-log-element.svelte';
	import AgentQueueLogElement from './agent-queue-log-element.svelte';
	import ChatAgentInfo from '../agent-info/chat-agent-info.svelte';
	import LatestStateLog from './latest-state-log.svelte';

    /**
     * @type {{
     *   agent: import('$agentTypes').AgentModel,
     *   msgStateLogs?: any[],
     *   agentQueueLogs?: any[],
     *   latestStateLog?: Object | null,
     *   closeWindow: () => void
     * }}
     */
    let {
        agent,
        msgStateLogs = $bindable([]),
        agentQueueLogs = $bindable([]),
        latestStateLog = null,
        closeWindow
    } = $props();

    /** @type {any[]} */
    let scrollbars = [];

    const msgStateLogTab = 1;
    const agentQueueLogTab = 2;
    const duration = 800;
    const inDuration = 800;
    const outDuration = 80;

    const options = {
		scrollbars: {
			visibility: 'auto',
			autoHide: 'move',
			autoHideDelay: 100,
			dragScroll: true,
			clickScroll: false,
			theme: 'os-theme-dark',
			pointers: ['mouse', 'touch', 'pen']
		}
	};

    $effect(() => {
        // Track reactive dependencies to re-run on changes
        msgStateLogs;
        agentQueueLogs;
        latestStateLog;

        scrollToBottom();
    });

    onDestroy(() => {
        cleanLogs();
    });

    function scrollToBottom() {
        const scrollbarElements = [
            document.querySelector('.latest-state-log-scrollbar'),
            document.querySelector('.msg-state-log-scrollbar'),
            document.querySelector('.agent-queue-log-scrollbar')
        ].filter(Boolean);
        scrollbarElements.forEach(elem => {
            // @ts-ignore
            scrollbars = [ ...scrollbars, OverlayScrollbars(elem, options) ];
        });

        scrollbars.forEach(scrollbar => {
            setTimeout(() => {
                const { viewport } = scrollbar.elements();
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }, 200);
        });
    }

    function cleanLogs() {
        msgStateLogs = [];
        agentQueueLogs = [];
        latestStateLog = null;
    }

    /**
	 * @param {number} logType
	 */
    function closeLog(logType) {
        if (logType === msgStateLogTab) {
            msgStateLogs = [];
        } else if (logType === agentQueueLogTab) {
            agentQueueLogs = [];
        }
    }
</script>

<!--
  NOTE: .latest-state-log-scrollbar, .msg-state-log-scrollbar and
  .agent-queue-log-scrollbar are DOM hooks queried by scrollToBottom().
  Keep those class names on the markup; styling is done via the
  scoped .il-* siblings.
-->
<div class="il-root">
    <div class="il-card">
        <div class="il-close-bar">
            <div>
                <button
                    type="button"
                    class="il-close-btn"
                    aria-label="Close log window"
                    onclick={() => closeWindow()}
                >
                    <i class="mdi mdi-window-close"></i>
                </button>
            </div>
        </div>
        <div class="il-body">
            {#if !!agent}
            <div
                class="il-section il-section-agent"
                transition:fade={{ duration: duration }}
            >
                <div class="il-agent-info">
                    <ChatAgentInfo agent={agent} />
                </div>
            </div>
            {/if}

            {#if !!agentQueueLogs && agentQueueLogs?.length > 0}
            <div
                class="il-section il-section-sm"
                in:fade={{ duration: inDuration }}
                out:fade={{ duration: outDuration }}
            >
                <div class="il-section-close">
                    <button
                        type="button"
                        class="il-section-close-btn"
                        aria-label="Close agent queue log"
                        onclick={() => closeLog(agentQueueLogTab)}
                    >
                        <i class="mdi mdi-window-close"></i>
                    </button>
                </div>
                <div class="il-scroll agent-queue-log-scrollbar">
                    <ul class="il-list">
                        {#each agentQueueLogs as log (log.uid)}
                            <AgentQueueLogElement data={log} />
                        {/each}
                    </ul>
                </div>
            </div>
            {/if}

            {#if !!msgStateLogs && msgStateLogs?.length > 0}
            <div
                class="il-section il-section-lg"
                in:fade={{ duration: inDuration }}
                out:fade={{ duration: outDuration }}
            >
                <div class="il-section-close">
                    <button
                        type="button"
                        class="il-section-close-btn"
                        aria-label="Close message state log"
                        onclick={() => closeLog(msgStateLogTab)}
                    >
                        <i class="mdi mdi-window-close"></i>
                    </button>
                </div>
                <div class="il-scroll msg-state-log-scrollbar">
                    <ul class="il-list">
                        {#each msgStateLogs as log (log.uid)}
                            <MessageStateLogElement data={log} />
                        {/each}
                    </ul>
                </div>
            </div>
            {/if}
            {#if latestStateLog && Object.keys(latestStateLog)?.length > 0}
            <div
                class="il-section il-section-md"
                in:fade={{ duration: inDuration }}
                out:fade={{ duration: outDuration }}
            >
                <div class="il-latest-scroll latest-state-log-scrollbar">
                    <div>
                        <LatestStateLog data={latestStateLog} />
                    </div>
                </div>
            </div>
            {/if}
        </div>

        <div class="il-footer"></div>
    </div>
</div>

<style>
    /* ===== Root wrapper (replaces .chat-log) ===== */
    .il-root {
        height: 100vh;
    }

    /* ===== Card shell (replaces .card.mb-0.log-background.log-flex) ===== */
    .il-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: rgb(0 0 0);
        margin-bottom: 0;
        border: 0;
        border-radius: 0;
    }

    /* ===== Sticky close-window bar (replaces .log-close-btn.padding-side.log-header) ===== */
    .il-close-bar {
        flex: 0 0 auto;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        padding: 0 20px;
        position: sticky;
        display: flex;
        justify-content: space-between;
    }

    /* Close-window button (replaces .btn.btn-sm.btn-secondary.btn-rounded.chat-send) */
    .il-close-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem 0.6rem;
        font-size: 0.8125rem;
        line-height: 1.2;
        border-radius: 999px;
        border: 1px solid var(--color-secondary);
        background-color: var(--color-secondary);
        color: rgb(255 255 255);
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .il-close-btn:hover,
    .il-close-btn:focus {
        background-color: color-mix(in srgb, var(--color-secondary) 88%, black 12%);
        border-color: color-mix(in srgb, var(--color-secondary) 88%, black 12%);
    }

    /* ===== Body (replaces .log-body.instant-log-body) ===== */
    .il-body {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 0 20px;
        overflow-y: scroll;
        scrollbar-width: none;
    }
    .il-body::-webkit-scrollbar {
        display: none;
    }

    /* ===== Footer placeholder (replaces .log-footer) ===== */
    .il-footer {
        flex: 0 0 auto;
    }

    /* ===== Log section (replaces .log-list.instant-log-section) ===== */
    .il-section {
        background-color: rgb(0 0 0);
        border-radius: 10px;
        border: 1px solid var(--color-secondary);
        display: flex;
        flex-direction: column;
    }
    .il-section-sm {
        flex: 0 0 150px;
        height: 150px;
        min-height: 150px;
    }
    .il-section-md {
        flex: 0 0 280px;
        height: 280px;
        min-height: 280px;
    }
    .il-section-lg {
        flex: 0 0 400px;
        height: 400px;
        min-height: 400px;
    }

    /* Agent-info section: scrolls within its own panel
       (replaces .chat-agent-info inside .instant-log-section) */
    .il-agent-info {
        padding: 0 20px;
        overflow-y: scroll;
        scrollbar-width: none;
        flex: 0 0 fit-content;
        height: fit-content;
        max-height: 280px;
    }
    .il-agent-info::-webkit-scrollbar {
        display: none;
    }

    /* Close-icon header on collapsible sections
       (replaces .close-icon { color: red; font-size: 20px; padding: 0 5px }) */
    .il-section-close {
        font-size: 20px;
        color: var(--color-danger, #ef4444);
        padding: 0 5px;
    }
    .il-section-close-btn {
        background: transparent;
        border: 0;
        padding: 0;
        color: inherit;
        float: right;
        cursor: pointer;
        line-height: 1;
    }
    .il-section-close-btn:hover {
        opacity: 0.85;
    }

    /* Scrollable list containers (the .agent-queue-log-scrollbar /
       .msg-state-log-scrollbar siblings are kept as DOM hooks for
       OverlayScrollbars; .il-scroll owns the padding rules previously
       provided by .padding-side) */
    .il-scroll {
        padding: 0 20px;
    }
    .il-list {
        list-style: none;
        margin: 0;
        padding-left: 2px;
        padding-right: 0;
    }

    /* Latest-state-log panel: 8px inset (replaces .latest-state-log) */
    .il-latest-scroll {
        padding: 8px;
    }
</style>
