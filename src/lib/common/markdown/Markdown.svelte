<script>
	import { onMount } from 'svelte';
	import { marked } from 'marked';
    import { replaceMarkdown, replaceNewLine } from '$lib/helpers/http';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { v4 as uuidv4 } from 'uuid';

	let {
		/** @type {string} */
		text = '',
		/** @type {string} */
		containerClasses = '',
		/** @type {string} */
		containerStyles = '',
		/** @type {boolean} */
		rawText = false,
		/** @type {boolean} */
		scrollable = false
	} = $props();

	const scrollbarId = `markdown-scrollbar-${uuidv4()}`;
	const options = {
		scrollbars: {
			visibility: 'auto',
			autoHide: 'move',
			autoHideDelay: 100,
			dragScroll: true,
			clickScroll: false,
			theme: 'os-theme-light',
			pointers: ['mouse', 'touch', 'pen']
		}
	};

	onMount(() => {
		if (scrollable) {
			initScrollbar();
		}
	});

	function initScrollbar() {
        const elem = document.querySelector(`#${scrollbarId}`);
		if (elem) {
			// @ts-ignore
			const scrollbar = OverlayScrollbars(elem, options);
		}
    }

	let innerText = $derived.by(() => {
		const normalizedText = typeof text !== 'string' ? `${JSON.stringify(text)}` : text;
		const markedText = !rawText
			? replaceNewLine(marked(replaceMarkdown(normalizedText || ''))?.toString())
			: marked(normalizedText || '')?.toString();
		if (!!markedText && markedText.endsWith('<br>')) {
			const idx = markedText.lastIndexOf('<br>');
			return markedText.substring(0, idx);
		} else {
            return markedText;
        }
	});
</script>

<div
	id={`${scrollbarId}`}
	class={`markdown-container markdown-lite ${containerClasses || 'text-white'}`}
	style={`${containerStyles}`}
>
	{@html innerText}
	<!-- <SvelteMarkdown
		source={innerText}
		renderers={{
			code: CodeBlock
		}}
	/> -->
</div>