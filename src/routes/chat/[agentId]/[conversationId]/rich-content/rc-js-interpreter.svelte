<script>
	import { onMount } from "svelte";
    import { marked } from "marked";
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
    import { v4 as uuidv4 } from 'uuid';

    /** @type {import('$conversationTypes').ChatResponseModel?} */
    export let message;

    /** @type {boolean} */
	export let scrollable = false;

    const scrollbarId = `js-interpreter-scrollbar-${uuidv4()}`;
    const options = {
		scrollbars: {
			visibility: 'auto',
			autoHide: 'move',
			autoHideDelay: 100,
			dragScroll: true,
			clickScroll: false,
			theme: 'os-theme-dark',
			pointers: ['mouse', 'touch', 'pen']
		}
	};

    onMount(() => {
        if (scrollable) {
            initScrollbar();
        }

        initCode();
    });

    function initScrollbar() {
        const elem = document.querySelector(`#${scrollbarId}`);
		if (elem) {
			// @ts-ignore
			const scrollbar = OverlayScrollbars(elem, options);
		}
    }

    function initCode() {
        try {
            const text = message?.rich_content?.message?.text || message?.text || '';
            const parsedText = marked.lexer(text);
            // @ts-ignore
            const codeText = parsedText.filter(x => !!x.text).map(x => x.text).join('');
            loadScript(codeText);
        } catch (error) {
            console.error('Error parsing js code:', error);
        }
    }

    /** @param {string} codeText */
    function loadScript(codeText) {
        const code = codeText.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '$1');
        const matchedSrcs = codeText.match(/<script\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/i);
        if (matchedSrcs && matchedSrcs[1]) {
            const curScripts = document.head.getElementsByTagName("script");
            const found = Array.from(curScripts).find(x => x.src === matchedSrcs[1]);
            if (found) {
                found.remove();
            }

            const script = document.createElement('script');
            script.src = matchedSrcs[1];
            script.onload = () => eval(code);
            document.head.appendChild(script);
        } else {
            eval(code);
        }
    }
</script>

<div>
    {#if message?.text}
        <div class="mb-3">{message.text}</div>
    {/if}
    <div id={`${scrollbarId}`}>
        <div id={`chart-${message?.message_id}`} style="min-width: 1000px; max-height: 500px;"></div>
    </div>
</div>