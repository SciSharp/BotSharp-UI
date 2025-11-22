<script>
	import { onMount, onDestroy } from 'svelte';
	import { globalErrorStore, loaderStore } from '$lib/helpers/store';

    /** @type {boolean} */
	export let isLoading = false;
	export let hasError = false;

	/** @type {any} */
	let loaderUnsubscriber;
	/** @type {any} */
	let errorUnsubscriber;

    onMount(() => {
        window?.speechSynthesis?.cancel();
        loaderUnsubscriber = loaderStore.subscribe(value => {
			isLoading = value;
		});

		errorUnsubscriber = globalErrorStore.subscribe(value => {
			hasError = value;
		});
    });

    onDestroy(() => {
        loaderUnsubscriber?.();
		errorUnsubscriber?.();
    });
</script>