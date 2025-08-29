<script>
	import { onMount } from "svelte";
    import { marked } from "marked";
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
    import { v4 as uuidv4 } from 'uuid';
	import LoadingDots from "$lib/common/LoadingDots.svelte";

    /** @type {import('$conversationTypes').ChatResponseModel?} */
    export let message;

   /** @type {string} */
    export let containerClasses = '';

    /** @type {string} */
    export let containerStyles = '';

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

    /** @type {boolean} */
    let isLoading = false;

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
            isLoading = true;
            loadScript(codeText).finally(() => {
                isLoading = false;
            });
        } catch (error) {
            console.error('Error parsing js code:', error);
        }
    }

    /** 
     * @param {string} codeText
     * @returns {Promise<boolean>} 
     */
    function loadScript(codeText) {
        return new Promise((resolve, reject) => {
            const code = codeText.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '$1');
            const scriptTags = [...codeText.matchAll(/<script\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi)];
            const matchedSrcs = scriptTags.filter(x => !!x[1]).map(x => x[1]);

            if (matchedSrcs.length > 0) {
                const promises = matchedSrcs.map(x => loadScriptSrc(x));
                Promise.all(promises).then(() => {
                    setTimeout(() => {
                        eval(code);
                        resolve(true);
                    }, 0);
                }).catch(() => {
                    reject(false);
                });
            } else {
                setTimeout(() => {
                    eval(code);
                    resolve(true);
                }, 0);
            }
        });
        
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

<div class={`${containerClasses}`} style={`${containerStyles}`}>
    {#if message?.text}
        <div class="mb-3">{message.text}</div>
    {/if}
    {#if isLoading}
        <div class="mb-3">
            <LoadingDots duration={'1s'} size={5} gap={3} color={'var(--bs-primary)'} />
        </div>
    {/if}
    <div id={`${scrollbarId}`}>
        <div id={`chart-${message?.message_id}`} style="min-width: 800px; max-height: 500px;"></div>
    </div>
</div>