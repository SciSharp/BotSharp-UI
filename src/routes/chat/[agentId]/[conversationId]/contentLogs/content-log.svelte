<script>
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { afterUpdate, onDestroy, onMount, tick } from 'svelte';
	import ContentLogElement from './content-log-element.svelte';
	import { page } from '$app/stores';
	import { GetContentLogs } from '$lib/services/logging-service';
	import AgentQueueChangeElement from './agent-queue-change-element.svelte';

    /** @type {import('$types').ConversationContentLogModel[]} */
    export let contentLogs = [];

    /** @type {import('$types').AgentQueueChangedModel[]} */
    export let agentQueueChangeLogs = [];

    /** @type {() => void} */
    export let closeWindow;

    /** @type {() => void} */
    export let cleanScreen;

    /** @type {any[]} */
    let scrollbars = [];

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
        const conversationId = $page.params.conversationId;
        contentLogs = await GetContentLogs(conversationId);

        const scrollbarElements = [
            document.querySelector('.content-log-scrollbar'),
            document.querySelector('.queue-change-log-scrollbar')
        ].filter(Boolean);
        scrollbarElements.forEach(elem => {
            scrollbars = [ ...scrollbars, OverlayScrollbars(elem, options) ];
        });

		refresh();
	});

    afterUpdate(() => {
        refresh();
    });

    onDestroy(() => {
        cleanLogs();
    });

    async function refresh() {
        // @ts-ignore
        scrollbars.forEach(scrollbar => {
            setTimeout(() => {
                const { viewport } = scrollbar.elements();
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }, 200);
        });
    }
    
    function cleanLogs() {
        contentLogs = [];
    }

    function handleCleanScreen() {
        cleanLogs();
        cleanScreen && cleanScreen();
    }
</script>

<div class="chat-log">
    <div class="card mb-0 log-background" style="height: 100%;">
        <div class="log-close-btn padding-side">
            <div>
                <button
                    type="button"
                    class="btn btn-sm btn-secondary btn-rounded chat-send waves-effect waves-light"
                    on:click={() => handleCleanScreen()}
                >
                    <i class="bx bx-trash"></i>
                </button>
            </div>
            
            <div class="queue-change-log-scrollbar queue-change-log-list log-list">
                <ul>
                    {#each agentQueueChangeLogs as log}
                        <AgentQueueChangeElement data={log} />
                    {/each}
                </ul>
            </div>

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
        <div class="content-log-scrollbar content-log-list log-list padding-side">
            <ul>
                {#each contentLogs as log}
                    <ContentLogElement data={log} />
                {/each}
            </ul>
        </div>
    </div>
</div>