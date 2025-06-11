<script>
	import { onMount } from 'svelte';
	import { marked } from 'marked';
    import { replaceMarkdown, replaceNewLine } from '$lib/helpers/http';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { v4 as uuidv4 } from 'uuid';

    /** @type {string} */
	export let text;

	/** @type {string} */
	export let containerClasses = "";

	/** @type {string} */
	export let containerStyles = "";

	/** @type {boolean} */
	export let rawText = false;

	const scrollbarId = uuidv4();

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
		initScrollbar();
	});

	function initScrollbar() {
        const elem = document.querySelector(`#markdown-scrollbar-${scrollbarId}`);
		if (elem) {
			// @ts-ignore
			const scrollbar = OverlayScrollbars(elem, options);
		}
    }

    let innerText = '';
	$: {
		if (typeof text !== 'string') {
			text = `${JSON.stringify(text)}`;
		}
		const markedText = !rawText ? replaceNewLine(marked(replaceMarkdown(text || ''))?.toString()) : marked(text || '')?.toString();
		if (!!markedText && markedText.endsWith('<br>')) {
			const idx = markedText.lastIndexOf('<br>');
			innerText = markedText.substring(0, idx);
		} else {
            innerText = markedText;
        }
	}
</script>

<div
	id={`markdown-scrollbar-${scrollbarId}`}
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