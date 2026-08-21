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

        initScrollbars();
        scrollToBottom();
    });

    onDestroy(() => {
        cleanLogs();
    });

    function initScrollbars() {
        const scrollbarElements = [
            document.querySelector('.instant-log-scrollbar'),
            document.querySelector('.latest-state-log-scrollbar'),
            document.querySelector('.msg-state-log-scrollbar'),
            document.querySelector('.agent-queue-log-scrollbar')
        ].filter(Boolean);
        scrollbarElements.forEach(elem => {
            // @ts-ignore
            if (elem.hasAttribute('data-overlayscrollbars')) {
                return;
            }
            // @ts-ignore
            scrollbars = [ ...scrollbars, OverlayScrollbars(elem, options) ];
        });
    }

    let _scrollScheduled = false;
    function scrollToBottom() {
        if (_scrollScheduled) {
            return;
        }
        _scrollScheduled = true;
        requestAnimationFrame(() => {
            setTimeout(() => {
                scrollbars.forEach(scrollbar => {
                    const { viewport } = scrollbar.elements();
                    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
                });
                _scrollScheduled = false;
            }, 150);
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

<div class="il-root font-code">
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
        <div class="il-body instant-log-scrollbar">
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


