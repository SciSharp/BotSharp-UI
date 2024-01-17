<script>
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { afterUpdate, onMount } from 'svelte';

    /** @type {any[]} */
    export let logs = [];

    /** @type {() => void} */
    export let closeLog;

    // @ts-ignore
    let scrollbar;

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
		const scrollElements = document.querySelectorAll('.scrollbar');
		scrollElements.forEach((item) => {
			scrollbar = OverlayScrollbars(item, options);
		});

		refreshLog();
	});

    afterUpdate(() => {
        refreshLog();
    });


    function refreshLog() {
      // trigger UI render
      logs = logs;

      setTimeout(() => {
		const { viewport } = scrollbar.elements();
		viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' }); // set scroll offset
	  }, 200);
    }
     
</script>

<div class="chat-log">
    <div class="card mb-0" style="height: 100%;">
        <div class="log-close-btn padding-side ">
            <button
                type="button"
                class="btn btn-danger btn-rounded chat-send waves-effect waves-light"
                on:click={() => closeLog()}
            >
                <span class="d-none d-sm-inline-block me-2" >Close</span><i class="mdi mdi-window-close"></i>
            </button>
        </div>
        <div class="scrollbar log-list padding-side">
            <ul>
                {#each logs as log}
                    <div class="log-element">
                        <div class="log-content">
                            {log}
                        </div>
                    </div>
                {/each}
            </ul>
        </div>
    </div>
</div>