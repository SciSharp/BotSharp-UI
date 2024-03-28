<script>
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { GetStateLogs } from '$lib/services/logging-service';
    import StateLogElement from './state-log-element.svelte';
	import StateChangeElement from './state-change-element.svelte';

    /** @type {any[]} */
    export let stateLogs = [];

    /** @type {any[]} */
    export let stateChangeLogs = [];

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
        const conversationId = $page.params.conversationId;
        stateLogs = await GetStateLogs(conversationId);
        
        const scrollbarElements = [
            document.querySelector('.state-log-scrollbar'),
            document.querySelector('.state-change-scrollbar')
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

    function refresh() {
        // @ts-ignore
        scrollbars.forEach(scrollbar => {
            setTimeout(() => {
                const { viewport } = scrollbar.elements();
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }, 200);
        });
    }

    function cleanLogs() {
        stateLogs = [];
    }

    function handleCleanScreen() {
        cleanLogs();
        cleanScreen && cleanScreen();
    }
</script>

<div class="chat-log">
    <div class="card mb-0 log-background" style="height: 100%;">
        <div class="log-close-btn padding-side">
            <button
                type="button"
                class="btn btn-sm btn-secondary btn-rounded chat-send waves-effect waves-light"
                on:click={() => closeWindow()}
            >
                <i class="mdi mdi-window-close"></i>
            </button>
            <button
                type="button"
                class="btn btn-sm btn-secondary btn-rounded chat-send waves-effect waves-light"
                on:click={() => handleCleanScreen()}
            >
                <i class="bx bx-trash"></i>
            </button>
        </div>
        <div class="state-change-scrollbar state-change-log-list log-list padding-side">
            <ul>
                {#each stateChangeLogs as log}
                    <StateChangeElement data={log} />
                {/each}
            </ul>
        </div>
        <div class="state-log-scrollbar state-log-list log-list padding-side">
            <ul>
                {#each stateLogs as log}
                    <StateLogElement data={log} />
                {/each}
            </ul>
        </div>
    </div>
</div>