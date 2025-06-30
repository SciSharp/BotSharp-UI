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

    const scrollbarId = uuidv4();
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
        const elem = document.querySelector(`#js-interpreter-scrollbar-${scrollbarId}`);
		if (elem) {
			// @ts-ignore
			const scrollbar = OverlayScrollbars(elem, options);
		}
    }

    function initCode() {
        const text = message?.rich_content?.message?.text || message?.text || '';
        const parsedText = marked.lexer(text);
        // @ts-ignore
        const codeText = parsedText.find(token => token.type === 'code' || token.type === 'html')?.text || '';
        const code = codeText.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/i, '$1');
        eval(code);
    }
</script>

<div id={`js-interpreter-scrollbar-${scrollbarId}`}>
    <div id={`chart-${message?.message_id}`}></div>
</div>