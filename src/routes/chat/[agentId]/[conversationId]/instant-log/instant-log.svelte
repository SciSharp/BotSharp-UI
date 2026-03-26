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

<div class="chat-log">
    <div class="card mb-0 log-background log-flex">
        <div class="log-close-btn padding-side log-header">
            <div>
                <button
                    type="button"
                    class="btn btn-sm btn-secondary btn-rounded chat-send waves-effect waves-light"
                    aria-label="Close log window"
                    onclick={() => closeWindow()}
                >
                    <i class="mdi mdi-window-close"></i>
                </button>
            </div>
        </div>
        <div class="log-body instant-log-body">
            {#if !!agent}
            <div
                class="log-list instant-log-section"
                transition:fade={{ duration: duration }}
            >
                <div class="chat-agent-info padding-side">
                    <ChatAgentInfo agent={agent} />
                </div>
            </div>
            {/if}

            {#if !!agentQueueLogs && agentQueueLogs?.length > 0}
            <div
                class="log-list instant-log-section instant-log-sec-sm"
                in:fade={{ duration: inDuration }}
                out:fade={{ duration: outDuration }}
            >
                <div class="close-icon">
                    <button
                        type="button"
                        class="btn btn-link p-0"
                        style="float: right;"
                        aria-label="Close agent queue log"
                        onclick={() => closeLog(agentQueueLogTab)}
                    >
                        <i class="mdi mdi-window-close"></i>
                    </button>
                </div>
                <div class="agent-queue-log-scrollbar padding-side">
                    <ul>
                        {#each agentQueueLogs as log (log.uid)}
                            <AgentQueueLogElement data={log} />
                        {/each}
                    </ul>
                </div>
            </div>
            {/if}

            {#if !!msgStateLogs && msgStateLogs?.length > 0}
            <div
                class="log-list instant-log-section instant-log-sec-lg"
                in:fade={{ duration: inDuration }}
                out:fade={{ duration: outDuration }}
            >
                <div class="close-icon">
                    <button
                        type="button"
                        class="btn btn-link p-0"
                        style="float: right;"
                        aria-label="Close message state log"
                        onclick={() => closeLog(msgStateLogTab)}
                    >
                        <i class="mdi mdi-window-close"></i>
                    </button>
                </div>
                <div class="msg-state-log-scrollbar padding-side" >
                    <ul>
                        {#each msgStateLogs as log (log.uid)}
                            <MessageStateLogElement data={log} />
                        {/each}
                    </ul>
                </div>
            </div>
            {/if}
            {#if latestStateLog && Object.keys(latestStateLog)?.length > 0}
            <div
                class="log-list instant-log-section instant-log-sec-md"
                in:fade={{ duration: inDuration }}
                out:fade={{ duration: outDuration }}
            >
                <div class="latest-state-log-scrollbar latest-state-log">
                    <div>
                        <LatestStateLog data={latestStateLog} />
                    </div>
                </div>
            </div>
            {/if}
        </div>
        
        <div class="log-footer"></div>
    </div>
</div>