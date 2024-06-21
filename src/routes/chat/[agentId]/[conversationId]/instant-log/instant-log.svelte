<script>
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { GetStateLogs } from '$lib/services/logging-service';
    import NavBar from '$lib/common/nav-bar/NavBar.svelte';
    import NavItem from '$lib/common/nav-bar/NavItem.svelte';
    import ConversationStateLogElement from '../persist-log/conversation-state-log-element.svelte';
	import MessageStateLogElement from './message-state-log-element.svelte';

    /** @type {any[]} */
    export let msgStateLogs = [];

    /** @type {any[]} */
    export let agentQueueLogs = [];

    /** @type {() => void} */
    export let closeWindow;

    /** @type {() => void} */
    export let cleanScreen;

    /** @type {any} */
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
        const scrollbarElements = [
            document.querySelector('.msg-state-log-scrollbar')
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
    }

    function handleCleanScreen() {
        cleanLogs();
        cleanScreen && cleanScreen();
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
        <!-- <div class="log-list padding-side log-body" class:hide={selectedTab !== convStateLogTab}>
            <ul>
                {#each convStateLogs as log}
                    <ConversationStateLogElement data={log} />
                {/each}
            </ul>
        </div> -->

        <div class="msg-state-log-scrollbar log-list padding-side log-body">
            <ul>
                {#each msgStateLogs as log}
                    <MessageStateLogElement data={log} />
                {/each}
            </ul>
        </div>

        <div class="log-footer nav-group"></div>
    </div>
</div>