<script>
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import StateLogElement from './state-log-element.svelte';
	import { page } from '$app/stores';
	import { GetStateLogs } from '$lib/services/logging-service';

    /** @type {any[]} */
    export let stateLogs = [];

    /** @type {() => void} */
    export let closeWindow;

    /** @type {() => void} */
    export let cleanScreen;

    // @ts-ignore
    let scrollbar;
    /** @type {any[]} */
    let initLogs = [];

    $: allLogs = [...initLogs, ...stateLogs];

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
        initLogs = await GetStateLogs(conversationId);
        
		const scrollElement = document.querySelector('.state-log-scrollbar');
		scrollbar = OverlayScrollbars(scrollElement, options);
		refresh();
	});

    afterUpdate(() => {
        refresh();
    });

    onDestroy(() => {
        cleanLogs();
    });

    function refresh() {
        setTimeout(() => {
            const { viewport } = scrollbar.elements();
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' }); // set scroll offset
        }, 200);
    }

    function cleanLogs() {
        initLogs = [];
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
        <div class="state-log-scrollbar log-list padding-side">
            <ul>
                {#each allLogs as log}
                    <StateLogElement data={log} />
                {/each}
            </ul>
        </div>
    </div>
</div>