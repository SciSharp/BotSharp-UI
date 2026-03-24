<script>
	import '../app.css';
	import { addMessages, init, getLocaleFromNavigator } from 'svelte-i18n';
	import en from '$lib/langs/en.json';
	import {
		PUBLIC_PRIMARY_COLOR,
		PUBLIC_SECONDARY_COLOR
	} from '$env/static/public';

	addMessages('en', en);

	init({
		fallbackLocale: 'en',
		initialLocale: getLocaleFromNavigator()
	});

	/** @type {Record<string, string>} */
	const colorOverrides = {
		...(PUBLIC_PRIMARY_COLOR   ? { '--bs-primary': PUBLIC_PRIMARY_COLOR, '--bs-primary-rgb': hexToRgb(PUBLIC_PRIMARY_COLOR) } : {}),
		...(PUBLIC_SECONDARY_COLOR ? { '--bs-secondary': PUBLIC_SECONDARY_COLOR, '--bs-secondary-rgb': hexToRgb(PUBLIC_SECONDARY_COLOR) } : {}),
	};

	const styleOverride = Object.entries(colorOverrides).map(([k, v]) => `${k}:${v}`).join(';');

	/**
	 * Convert a hex color string to an "r, g, b" string for Bootstrap's rgb variables.
	 * @param {string} hex
	 * @returns {string}
	 */
	function hexToRgb(hex) {
		const h = hex.replace('#', '');
		const n = parseInt(h, 16);
		return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
	}
</script>

<svelte:head>
	{#if styleOverride}
		{@html `<style>:root { ${styleOverride} }</style>`}
	{/if}
</svelte:head>

<slot />

<style lang="scss">
	@import '$lib/scss/bootstrap.scss';
	@import '$lib/scss/app.scss';
	@import '$lib/scss/icons.scss';
</style>