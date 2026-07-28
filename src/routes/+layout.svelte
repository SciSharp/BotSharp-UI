<script>
	import '@fontsource/poppins/300.css';
	import '@fontsource/playfair-display/400.css';
	import '@fontsource/pacifico/400.css';
	import '@fontsource/lobster/400.css';
	import '@fontsource/bebas-neue/400.css';
	import '@fontsource/averia-libre/400.css';
	import '@fontsource/libre-baskerville/400.css';
	import '@fontsource/libre-baskerville/700.css';
	import '@fontsource/source-code-pro/400.css';
	import '@fontsource/rethink-sans/400.css';

	import '../app.css';
	import '$lib/scss/icons.scss';
	import '$lib/styles/app.scss';
	import { onMount } from 'svelte';
	import 'overlayscrollbars/overlayscrollbars.css';
	import { OverlayScrollbars } from 'overlayscrollbars';
	import { addMessages, init, getLocaleFromNavigator } from 'svelte-i18n';
	import { PUBLIC_PRIMARY_COLOR, PUBLIC_SECONDARY_COLOR } from '$env/static/public';
	import { isDesktop } from '$lib/services/simpleclaw-service';
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

	// Marks the document as the desktop shell so CSS can target it. Set here rather than
	// in app.html because the check needs `window`, and the static build has to keep
	// prerendering without it. Anything keyed on this must degrade gracefully in the
	// browser build, where the attribute never appears.
	onMount(() => {
		if (!isDesktop()) return;
		document.documentElement.setAttribute('data-desktop', '');

		// Overlay scrollbars for the document, desktop only.
		//
		// A native scrollbar always occupies layout width — that is what the pale strip
		// down the right edge was, and no amount of transparency removes it, because the
		// space is reserved whether or not anything is painted in it. An overlay
		// scrollbar draws ON TOP of the content instead, so nothing is reserved.
		//
		// Not applied in the browser build: there the scrollbar is chrome the person
		// already knows how to read, and replacing it is a cost with no matching benefit.
		const instance = OverlayScrollbars(document.body, {
			scrollbars: {
				theme: 'os-theme-dark',
				// 'leave' rather than 'move': visible the whole time the pointer is over
				// the area, gone when it leaves. 'move' would blink it away mid-read.
				autoHide: 'leave',
				autoHideDelay: 300,
				dragScroll: true,
				clickScroll: true
			}
		});

		return () => instance?.destroy();
	});
</script>

<svelte:head>
	{@html themeOverrideStyle}
</svelte:head>

<slot />

