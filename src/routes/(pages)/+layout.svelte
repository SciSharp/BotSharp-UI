<svelte:head>
	<!-- jsvectormap -->
	<script src="https://cdn.jsdelivr.net/npm/jsvectormap"></script>
	<script src="https://cdn.jsdelivr.net/npm/jsvectormap/dist/maps/world.js"></script>
</svelte:head>

<script>
	import VerticalLayout from '../VerticalLayout/Index.svelte';
	import { setAuthorization } from '$lib/helpers/http';

	let component = VerticalLayout;
	setAuthorization();
</script>

<svelte:component this={component}>
	<slot />
</svelte:component>