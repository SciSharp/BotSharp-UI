<svelte:head>
	<!-- jsvectormap -->
	<!-- <script src="https://cdn.jsdelivr.net/npm/jsvectormap"></script> -->
	<!-- <script src="https://cdn.jsdelivr.net/npm/jsvectormap/dist/maps/world.js"></script> -->
</svelte:head>

<script>
	import LiveChat from '$lib/common/shared/LiveChatEntry.svelte';
	import VerticalLayout from '../VerticalLayout/Index.svelte';

	let component = VerticalLayout;
</script>

<svelte:component this={component}>
	<slot />
</svelte:component>

<LiveChat />