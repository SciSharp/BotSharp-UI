<script>
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { afterUpdate, onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
	import MessageStateLogElement from './message-state-log-element.svelte';
	import AgentQueueLogElement from './agent-queue-log-element.svelte';
	import ChatAgentInfo from '../agent-info/chat-agent-info.svelte';
	import LatestStateLog from './latest-state-log.svelte';

    /** @type {import('$agentTypes').AgentModel} */
	export let agent;

    /** @type {any[]} */
    export let msgStateLogs = [];

    /** @type {any[]} */
    export let agentQueueLogs = [];

    /** @type {Object?} */
    export let latestStateLog = null;

    /** @type {() => void} */
    export let closeWindow;

    /** @type {any} */
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

    afterUpdate(() => {
        refresh();
    });

    onDestroy(() => {
        cleanLogs();
    });

    function refresh() {
        scrollToBottom();
    }

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

        // @ts-ignore
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
                    on:click={() => closeWindow()}
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
                    <span
                        style="float: right;"
                        role="link"
                        tabindex="-1"
                        on:keydown={() => {}}
                        on:click={() => closeLog(agentQueueLogTab)}
                    >
                        <i class="mdi mdi-window-close"></i>
                    </span>
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
                    <span
                        style="float: right;"
                        role="link"
                        tabindex="-1"
                        on:keydown={() => {}}
                        on:click={() => closeLog(msgStateLogTab)}
                    >
                        <i class="mdi mdi-window-close"></i>
                    </span>
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
            {#if latestStateLog}
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