<script>
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import MessageStateLogElement from './message-state-log-element.svelte';
	import AgentQueueLogElement from './agent-queue-log-element.svelte';

    /** @type {any[]} */
    export let msgStateLogs = [];

    /** @type {any[]} */
    export let agentQueueLogs = [];

    /** @type {boolean} */
    export let autoScroll = false;

    /** @type {() => void} */
    export let closeWindow;

    /** @type {() => void} */
    export let cleanScreen;

    /** @type {any} */
    let scrollbars = [];

    /** @type {boolean} */
    let closeMsgStateLog = false;
    let closeAgentQueueLog = false;

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
        // if (autoScroll) {
        //     closeMsgStateLog = true;
        //     closeAgentQueueLog = true;
        // }
        scrollToBottom();
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

    function handleCleanScreen() {
        cleanLogs();
        cleanScreen && cleanScreen();
    }

    /**
	 * @param {number} type
	 */
    function closeLog(type) {
        if (type === msgStateLogTab) {
            closeMsgStateLog = true;
        } else if (type === agentQueueLogTab) {
            closeAgentQueueLog = true;
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
            <div>
                <button
                    type="button"
                    class="btn btn-sm btn-secondary btn-rounded chat-send waves-effect waves-light"
                    on:click={() => handleCleanScreen()}
                >
                    <i class="bx bx-trash"></i>
                </button>
            </div>
        </div>
        <div class="log-body instant-log-body">
            <div class="log-list instant-log-section" class:hide={closeMsgStateLog}>
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
            
            <div class="log-list instant-log-section" class:hide={closeAgentQueueLog}>
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
        </div>
        
        <div class="log-footer"></div>
    </div>
</div>