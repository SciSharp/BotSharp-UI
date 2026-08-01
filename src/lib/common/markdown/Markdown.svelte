<script>
	import { onMount } from 'svelte';
	import { marked } from 'marked';
    import { replaceMarkdown, replaceNewLine } from '$lib/helpers/http';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { v4 as uuidv4 } from 'uuid';
	import { openAppRoute, openExternal, openPopup } from '$lib/helpers/utils/desktop';
	import { liveRunId } from '$lib/helpers/utils/common';

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

	/**
	 * Makes links inside the rendered markdown open somewhere other than on top of the page
	 * they were rendered in.
	 *
	 * `marked` emits a plain `<a href>` with no target, so a click navigates the current view
	 * away — in a chat that means abandoning the conversation the link arrived in, and in the
	 * desktop shell it means the app's only window becomes the linked page with no way back.
	 * Neither is what someone clicking a link in a message expects.
	 *
	 * Delegated from the container rather than bound per anchor: the markup comes from
	 * `{@html}`, so Svelte never sees those nodes and cannot attach to them. An action keeps
	 * this off the element as an `onclick`, which would make a11y demand keyboard handlers on
	 * a div; the real anchors stay focusable and Enter still reaches this through the click
	 * event a keypress on a link dispatches.
	 *
	 * @param {HTMLElement} node
	 */
	function interceptLinks(node) {
		/** @param {MouseEvent} e */
		const onClick = (e) => {
			// Modified clicks are the reader's own instruction about where to open something.
			if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

			const anchor = /** @type {Element | null} */ (e.target)?.closest?.('a');
			const href = anchor?.getAttribute('href');
			if (!href || href.startsWith('#')) return;

			let url;
			try {
				url = new URL(href, window.location.href);
			} catch {
				return;
			}

			// mailto:, tel: and friends are the OS's business — let the default happen.
			if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

			e.preventDefault();

			// A live view is checked before the same-origin split because it is neither case:
			// it is someone else's page, but one the reader has to operate while this
			// conversation stays visible. See openPopup.
			const runId = liveRunId(url);
			if (runId) {
				openPopup(url.href, {
					label: `run-${runId}`,
					title: `Live view · ${runId.slice(0, 8)}`
				});
			} else if (url.origin === window.location.origin) {
				openAppRoute(`${url.pathname}${url.search}${url.hash}`);
			} else {
				openExternal(url.href);
			}
		};

		node.addEventListener('click', onClick);
		return {
			destroy() {
				node.removeEventListener('click', onClick);
			}
		};
	}

	let innerText = $derived.by(() => {
		const normalizedText = typeof text !== 'string' ? `${JSON.stringify(text)}` : text;
		const markedText = !rawText
			? replaceNewLine(marked(replaceMarkdown(normalizedText || ''))?.toString())
			: marked(normalizedText || '', { breaks: true })?.toString();
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
	use:interceptLinks
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

    /* Tailwind's Preflight (app.css) resets ol/ul to `list-style: none` and
       zero padding in @layer base. These unlayered rules restore the markers
       for rendered markdown; call sites may still override padding/margins. */
    .markdown-container :global(strong) {
        font-weight: 700;
    }

    .markdown-container :global(ul) {
        list-style: disc outside;
        padding-left: 1.5rem;
    }
    .markdown-container :global(ol) {
        list-style: decimal outside;
        padding-left: 1.5rem;
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