<script>
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { afterUpdate, onDestroy, onMount, tick } from 'svelte';
	import ContentLogElement from './content-log-element.svelte';
	import { page } from '$app/stores';
	import { GetContentLogs } from '$lib/services/logging-service';

    /** @type {import('$types').ConversationContentLogModel[]} */
    export let contentLogs = [];

    /** @type {() => void} */
    export let closeWindow;

    /** @type {() => void} */
    export let cleanScreen;

    // @ts-ignore
    let scrollbar;
    /** @type {import('$types').ConversationContentLogModel[]} */
    let initLogs = [];

    $: allLogs = [...initLogs, ...contentLogs];

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
        initLogs = await GetContentLogs(conversationId);

		const scrollElements = document.querySelectorAll('.content-log-scrollbar');
		scrollElements.forEach((item) => {
			scrollbar = OverlayScrollbars(item, options);
		});

		refresh();
	});

    afterUpdate(() => {
        refresh();
    });

    onDestroy(() => {
        initLogs = [];
        contentLogs = [];
    });

    async function refresh() {
        setTimeout(() => {
            const { viewport } = scrollbar.elements();
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' }); // set scroll offset
        }, 200);
    }
     
</script>

<div class="chat-log" id="content-log-container">
    <div class="card mb-0 log-background" style="height: 100%;">
        <div class="log-close-btn padding-side">
            <button
                type="button"
                class="btn btn-sm btn-secondary btn-rounded chat-send waves-effect waves-light"
                on:click={() => cleanScreen()}
            >
                <i class="bx bx-trash"></i>
            </button>
            <button
                type="button"
                class="btn btn-sm btn-secondary btn-rounded chat-send waves-effect waves-light"
                on:click={() => closeWindow()}
            >
                <i class="mdi mdi-window-close"></i>
            </button>
        </div>
        <div class="content-log-scrollbar log-list padding-side">
            <ul>
                {#each allLogs as log}
                    <ContentLogElement data={log} />
                {/each}
            </ul>
        </div>
    </div>
</div>