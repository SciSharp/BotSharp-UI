<script>
	import { onMount } from 'svelte';
	import { marked, Renderer } from 'marked';
    import { replaceMarkdown, replaceNewLine } from '$lib/helpers/http';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { v4 as uuidv4 } from 'uuid';
	import { openAppRoute, openExternal, openPopup } from '$lib/helpers/utils/desktop';
	import { liveRunId, liveRunIdInText } from '$lib/helpers/utils/common';

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
		scrollable = false,
		/**
		 * Puts a copy button on every fenced code block. Off by default: on a log
		 * row or a state dump the control would be chrome over content nobody
		 * copies, and it is the message surfaces where a snippet is there to be
		 * taken somewhere else.
		 * @type {boolean}
		 */
		copyableCode = false
	} = $props();

	/**
	 * Marks the paragraph that offers a live view, so it can be dressed as the secondary thing
	 * it is.
	 *
	 * A step's note is a heading, what the step found, and a line offering the run it drove.
	 * The first two are the message; the third is a way in, and rendered as plain markdown it
	 * arrived in the same size and weight as the finding above it with a full-strength accent
	 * link — the loudest thing in a bubble whose point was the sentence above.
	 *
	 * AT THE PARAGRAPH, not the link: the sentence that qualifies the offer ("available for
	 * about 30 minutes after the step ran") sits OUTSIDE the anchor, and styling only the
	 * anchor leaves half the line at body weight. The producers all put the offer on a line of
	 * its own, which is what makes the paragraph the right unit.
	 *
	 * Matched on the URL rather than the wording, like everything else that reasons about these
	 * links: `liveRunIdInText` reads the href straight out of the rendered inline HTML. A
	 * paragraph that merely mentions a run link in passing gets the treatment too, which is
	 * the right answer — it is still an offer of a live view, wherever it sits.
	 */
	/**
	 * Wraps a fenced code block so it can carry a copy button.
	 *
	 * Emitted as part of the markdown HTML rather than attached to the DOM
	 * afterwards, so it survives every re-render of a streaming message without
	 * anything having to re-scan for new blocks. Nothing from the message is
	 * interpolated into it — the code is read back out of the DOM when the button
	 * is clicked, which keeps the copied text identical to what is on screen and
	 * keeps message content out of generated markup.
	 *
	 * @param {string} codeHtml
	 */
	function withCopyButton(codeHtml) {
		return '<div class="md-code">'
			+ '<button type="button" class="md-code-copy" aria-label="Copy code">'
			+ '<i class="bx bx-copy" aria-hidden="true"></i>'
			+ '<span class="md-code-copy-label">Copy</span>'
			+ '</button>'
			+ codeHtml
			+ '</div>';
	}

	/* Per instance rather than module-level, because the code renderer below
	   depends on `copyableCode`, which differs by call site. */
	const markdownRenderer = buildRenderer();

	function buildRenderer() {
		const renderer = new Renderer();

		const renderParagraph = renderer.paragraph.bind(renderer);
		renderer.paragraph = (text) => {
			if (!liveRunIdInText(text)) return renderParagraph(text);

			return `<p class="md-live-line"><i class="mdi mdi-motion-play-outline md-live-icon" aria-hidden="true"></i>${text}</p>`;
		};

		if (copyableCode) {
			const renderCode = renderer.code.bind(renderer);
			/**
			 * @param {string} code
			 * @param {string | undefined} infostring
			 * @param {boolean} escaped
			 */
			renderer.code = (code, infostring, escaped) => withCopyButton(renderCode(code, infostring, escaped));
		}

		return renderer;
	}

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

	/** The button currently showing its "copied" state, if any. */
	/** @type {Element | null} */
	let copiedBtn = null;
	/** @type {any} */
	let copyResetTimer = null;

	/**
	 * @param {Element} btn
	 * @param {boolean} done
	 */
	function setCopyState(btn, done) {
		const icon = btn.querySelector('i');
		const label = btn.querySelector('.md-code-copy-label');
		btn.classList.toggle('md-code-copy-done', done);
		if (icon) icon.className = done ? 'bx bx-check' : 'bx bx-copy';
		if (label) label.textContent = done ? 'Copied!' : 'Copy';
		btn.setAttribute('aria-label', done ? 'Code copied' : 'Copy code');
	}

	/**
	 * Copies a fenced code block, delegated for the same reason as
	 * `interceptLinks`: the buttons come from `{@html}`, so Svelte never sees
	 * those nodes and cannot bind to them.
	 *
	 * @param {HTMLElement} node
	 */
	function interceptCodeCopy(node) {
		/** @param {MouseEvent} e */
		const onClick = (e) => {
			const btn = /** @type {Element | null} */ (e.target)?.closest?.('.md-code-copy');
			if (!btn) return;

			// The surfaces this renders on put their own click on the block around
			// it — collapse a message, jump to its log entry — and reaching for a
			// snippet is not a request for either.
			e.preventDefault();
			e.stopPropagation();

			// Read from the DOM, so what lands on the clipboard is exactly what is
			// on screen. The trailing newline is `marked`'s, not the author's.
			const codeEl = btn.parentElement?.querySelector('pre code') || btn.parentElement?.querySelector('pre');
			const text = (codeEl?.textContent || '').replace(/\n$/, '');
			if (!text) return;

			navigator.clipboard?.writeText(text).then(() => {
				if (copiedBtn && copiedBtn !== btn) {
					setCopyState(copiedBtn, false);
				}
				clearTimeout(copyResetTimer);
				copiedBtn = btn;
				setCopyState(btn, true);
				copyResetTimer = setTimeout(() => {
					// A streaming re-render can have replaced the button by now.
					if (copiedBtn?.isConnected) {
						setCopyState(copiedBtn, false);
					}
					copiedBtn = null;
				}, 800);
			}).catch(() => {
				// Clipboard refused — an insecure context, or permission denied.
				// Leave the button alone rather than report a copy that never was.
			});
		};

		node.addEventListener('click', onClick);
		return {
			destroy() {
				clearTimeout(copyResetTimer);
				node.removeEventListener('click', onClick);
			}
		};
	}

	let innerText = $derived.by(() => {
		const normalizedText = typeof text !== 'string' ? `${JSON.stringify(text)}` : text;
		const markedText = !rawText
			? replaceNewLine(marked(replaceMarkdown(normalizedText || ''), { renderer: markdownRenderer })?.toString())
			: marked(normalizedText || '', { breaks: true, renderer: markdownRenderer })?.toString();
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
	use:interceptCodeCopy
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

    /* Copy control on a fenced code block — see `withCopyButton`.

       Absolutely positioned rather than given a header row of its own: these
       blocks sit in chat bubbles a few hundred pixels wide, where a bar above
       the code costs a line of the message. The wrapper has no padding or
       border, so the `pre`'s top margin collapses through it and the wrapper's
       top edge is the code's top edge, which is what the offsets below assume.

       Quiet until the block is hovered or the button is focused, so it does not
       compete with the code; always visible where there is no hover to reveal
       it. */
    .markdown-container :global(.md-code) {
        position: relative;
    }

    .markdown-container :global(.md-code-copy) {
        position: absolute;
        top: 0.35rem;
        right: 0.35rem;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 0.1rem 0.4rem;
        font-size: 11px;
        font-weight: 600;
        line-height: 1.6;
        color: rgb(255 255 255 / 0.75);
        background: rgb(0 0 0 / 0.55);
        border: 1px solid rgb(255 255 255 / 0.2);
        border-radius: 999px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.15s ease, color 0.15s ease, background-color 0.15s ease;
    }

    .markdown-container :global(.md-code-copy i) {
        font-size: 13px;
        line-height: 1;
    }

    .markdown-container :global(.md-code:hover .md-code-copy),
    .markdown-container :global(.md-code-copy:focus-visible),
    .markdown-container :global(.md-code-copy-done) {
        opacity: 1;
    }

    @media (hover: none) {
        .markdown-container :global(.md-code-copy) {
            opacity: 1;
        }
    }

    .markdown-container :global(.md-code-copy:hover) {
        color: rgb(255 255 255);
        background: rgb(0 0 0 / 0.78);
    }

    .markdown-container :global(.md-code-copy:focus-visible) {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }

    .markdown-container :global(.md-code-copy-done) {
        color: var(--color-success, #22c55e);
        border-color: color-mix(in srgb, var(--color-success, #22c55e) 45%, transparent);
    }

    /* The line that offers a live view — see the paragraph renderer.

       Quieter than the message it hangs off, and quieter than a link normally is here: it is a
       way in, offered under a finding somebody is reading, and at full accent it was the first
       thing the eye landed on in every step of a flow. Smaller, dimmer, with the same replay
       glyph the app uses for a recorded run.

       Colour comes from `currentColor` rather than a palette entry, so one rule is right in
       both variants — muted against a white bubble and muted against a dark one, without
       either having to know which surface it is on. The link gives up the accent and keeps an
       underline to stay recognisably a link, then takes the accent back on hover, which is
       where an affordance is worth being loud.

       Inline flow, deliberately not flex: the qualifying sentence follows the anchor as a
       sibling text node, and flex would make the two separate items that cannot wrap as one
       sentence. */
    .markdown-container :global(p.md-live-line) {
        margin-top: 0.45rem;
        font-size: 0.86em;
        line-height: 1.45;
        color: color-mix(in srgb, currentColor 58%, transparent);
    }

    .markdown-container :global(p.md-live-line .md-live-icon) {
        margin-right: 0.3rem;
        font-size: 1.05em;
        vertical-align: -0.08em;
    }

    /* Beats both variants' plain `a` rule: same element, one class deeper. */
    .markdown-container :global(p.md-live-line a) {
        color: inherit;
        text-decoration: underline;
        text-decoration-color: color-mix(in srgb, currentColor 35%, transparent);
        text-underline-offset: 0.16em;
        transition: color 0.15s ease, text-decoration-color 0.15s ease;
    }

    .markdown-container :global(p.md-live-line a:hover),
    .markdown-container :global(p.md-live-line a:focus-visible) {
        color: var(--color-primary);
        text-decoration-color: currentColor;
    }
</style>