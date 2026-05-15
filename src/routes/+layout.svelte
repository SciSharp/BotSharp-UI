<script>
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

