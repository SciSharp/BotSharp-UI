<script>
	import {PUBLIC_FAVICON_URL, PUBLIC_BRAND_NAME} from '$env/static/public'
	export let title = 'Home';
</script>

<svelte:head>
	<link rel="icon" type="image/x-icon" href={PUBLIC_FAVICON_URL}>
	<title>{title} | {PUBLIC_BRAND_NAME} - Admin & Dashboard</title>
</svelte:head>
