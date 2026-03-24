<script>
	import { onMount } from 'svelte';
	import { globalErrorStore, loaderStore } from '$lib/helpers/store';

	let {
		isLoading = $bindable(false),
		hasError = $bindable(false)
	} = $props();

	$effect(() => {
		isLoading = $loaderStore;
	});

	$effect(() => {
		hasError = $globalErrorStore;
	});

	onMount(() => {
		window?.speechSynthesis?.cancel();
	});
</script>