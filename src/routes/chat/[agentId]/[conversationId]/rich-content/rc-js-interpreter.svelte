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
        const scriptTags = [...codeText.matchAll(/<script\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi)];
        const matchedSrcs = scriptTags.filter(x => !!x[1]).map(x => x[1]);

        if (matchedSrcs.length > 0) {
            const promises = matchedSrcs.map(x => loadScriptSrc(x));
            Promise.all(promises).then(() => setTimeout(() => eval(code), 0));
        } else {
            setTimeout(() => eval(code), 0);
        }
    }

    /** @param {string} src */
    function loadScriptSrc(src) {
        return new Promise(resolve => {
            const curScripts = document.head.getElementsByTagName("script");
            const found = Array.from(curScripts).find(x => x.src === src);
            if (found) {
                found.remove();
            }

            const script = document.createElement('script');
            script.async = false;
            script.src = src;
            script.onload = () => {
                setTimeout(() => {
                    console.log(`Script loaded: ${src}`);
                    resolve(true);
                }, 0);
            }
            script.onerror = () => {
                setTimeout(() => {
                    console.log(`Error when loading script: ${src}`);
                    resolve(false);
                }, 0);
            }
            document.head.appendChild(script);
        });
    }
</script>

<div>
    {#if message?.text}
        <div class="mb-3">{message.text}</div>
    {/if}
    <div id={`${scrollbarId}`}>
        <div id={`chart-${message?.message_id}`}></div>
    </div>
</div>