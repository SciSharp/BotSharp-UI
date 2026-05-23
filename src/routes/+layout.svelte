<script>
	import '@fontsource/poppins/300.css';
	import '@fontsource/playfair-display/400.css';
	import '@fontsource/pacifico/400.css';
	import '@fontsource/lobster/400.css';
	import '@fontsource/bebas-neue/400.css';
	import '@fontsource/averia-libre/400.css';
	import '@fontsource/libre-baskerville/400.css';
	import '@fontsource/source-code-pro/400.css';
	import '@fontsource/rethink-sans/400.css';

	import '../app.css';
	import '$lib/scss/icons.scss';
	import '$lib/styles/app.scss';
	import { addMessages, init, getLocaleFromNavigator } from 'svelte-i18n';
	import { PUBLIC_PRIMARY_COLOR, PUBLIC_SECONDARY_COLOR } from '$env/static/public';
	import en from '$lib/langs/en.json';

	addMessages('en', en);

	init({
		fallbackLocale: 'en',
		initialLocale: getLocaleFromNavigator()
	});

	const themeOverrides = [
		PUBLIC_PRIMARY_COLOR && `--color-primary: ${PUBLIC_PRIMARY_COLOR};`,
		PUBLIC_SECONDARY_COLOR && `--color-secondary: ${PUBLIC_SECONDARY_COLOR};`
	]
		.filter(Boolean)
		.join(' ');

	const themeOverrideStyle = themeOverrides ? `<style>:root { ${themeOverrides} }</style>` : '';
</script>

<svelte:head>
	{@html themeOverrideStyle}
</svelte:head>

<slot />

