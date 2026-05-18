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

<style>
    /* Ported from src/lib/scss/custom/components/_markdown.scss. The HTML
       rendered here is injected via {@html} from `marked`, so Svelte's CSS
       scoping cannot hash the inner nodes — every selector that targets the
       rendered markup is wrapped in :global(). */
    .markdown-container {
        overflow-x: auto;
        scrollbar-width: thin;
    }
    .markdown-container :global(pre) {
        -ms-overflow-style: none;
        white-space: pre-wrap;
        margin-top: 1em;
        margin-bottom: 1em;
    }
    .markdown-container :global(pre::-webkit-scrollbar) {
        display: none;
    }
    /* Language-typed code blocks emitted by `marked` get the inverted-card
       treatment (dark surface, light text) regardless of the variant the
       Markdown.svelte parent uses, so the code stays legible inside both
       `markdown-lite` and `markdown-dark` containers. */
    .markdown-container :global(pre:has(.language-sql)),
    .markdown-container :global(pre:has(.language-java)),
    .markdown-container :global(pre:has(.language-javascript)),
    .markdown-container :global(pre:has(.language-typescript)),
    .markdown-container :global(pre:has(.language-csharp)),
    .markdown-container :global(pre:has(.language-python)),
    .markdown-container :global(pre:has(.language-json)) {
        background-color: black;
        color: white;
        border-radius: 5px;
        padding: 5px 10px;
    }

    .markdown-container :global(table) {
        margin-top: 1em;
        margin-bottom: 1em;
        border-radius: 5px;
    }
    .markdown-container :global(table th),
    .markdown-container :global(table td) {
        padding: 3px 5px;
    }

    .markdown-container :global(p) {
        margin-top: 0;
        margin-bottom: 0;
    }

    .markdown-container :global(ul) {
        list-style-position: outside;
    }

    /* Variant: `markdown-lite` — used when the container sits on a dark
       surface (e.g. the chat thread's avatar/tool rows). Borders and links
       are rendered in pure white. */
    .markdown-lite :global(table th),
    .markdown-lite :global(table td) {
        border: 1px solid white;
    }
    .markdown-lite :global(a) {
        color: white;
    }

    /* Variant: `markdown-dark` — used when the container sits on a light
       surface (e.g. the assistant bubble's white card). Borders and links
       use the primary accent. When both variants are applied to the same
       container (chat-box's `markdown-dark cb-md-dark` markdown-lite combo),
       these rules ship last in source order and win on equal specificity. */
    .markdown-dark :global(table th),
    .markdown-dark :global(table td) {
        border: 1px solid var(--color-primary);
    }
    .markdown-dark :global(a) {
        color: var(--color-primary);
    }
</style>