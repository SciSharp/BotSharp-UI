<script>
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import MessageStateLogElement from './message-state-log-element.svelte';
	import AgentQueueLogElement from './agent-queue-log-element.svelte';
	import ChatAgentInfo from '../agent-info/chat-agent-info.svelte';
	import LatestStateLog from './latest-state-log.svelte';

    /** @type {import('$types').AgentModel} */
	export let agent;

    /** @type {any[]} */
    export let msgStateLogs = [];

    /** @type {any[]} */
    export let agentQueueLogs = [];

    /** @type {import('$types').ConversationStateLogModel?} */
    export let latestStateLog = null;

    /** @type {boolean} */
    export let autoScroll = false;

    /** @type {() => void} */
    export let closeWindow;

    /** @type {any} */
    let scrollbars = [];

    const msgStateLogTab = 1;
    const agentQueueLogTab = 2;

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

    onMount(async () => {
        const scrollbarElements = [
            document.querySelector('.latest-state-log-scrollbar'),
            document.querySelector('.msg-state-log-scrollbar'),
            document.querySelector('.agent-queue-log-scrollbar')
        ].filter(Boolean);
        scrollbarElements.forEach(elem => {
            scrollbars = [ ...scrollbars, OverlayScrollbars(elem, options) ];
        });
		scrollToBottom();
	});

    afterUpdate(() => {
        refresh();
    });

    onDestroy(() => {
        cleanLogs();
    });

    function refresh() {
        if (autoScroll) {
            scrollToBottom();
        }
    }

    function scrollToBottom() {
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
            <div class="log-list instant-log-section">
                <div class="chat-agent-info padding-side">
                    <ChatAgentInfo agent={agent} />
                </div>
            </div>
            {/if}
            <div class="log-list instant-log-section instant-log-sec-sm" class:hide={!!!agentQueueLogs || agentQueueLogs?.length === 0}>
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
                        {#each agentQueueLogs as log}
                            <AgentQueueLogElement data={log} />
                        {/each}
                    </ul>
                </div>
            </div>
            <div class="log-list instant-log-section instant-log-sec-lg" class:hide={!!!msgStateLogs || msgStateLogs?.length === 0}>
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
                        {#each msgStateLogs as log}
                            <MessageStateLogElement data={log} />
                        {/each}
                    </ul>
                </div>
            </div>
            <div class="log-list instant-log-section instant-log-sec-lg" class:hide={!latestStateLog}>
                <div class="latest-state-log-scrollbar latest-state-log">
                    <div>
                        <LatestStateLog data={latestStateLog} />
                    </div>
                </div>
            </div>
        </div>
        
        <div class="log-footer"></div>
    </div>
</div>