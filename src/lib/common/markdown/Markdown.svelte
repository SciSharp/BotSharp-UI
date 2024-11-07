<script>
	import SvelteMarkdown from 'svelte-markdown';
    import { replaceMarkdown, replaceNewLine } from '$lib/helpers/http';
	import CodeBlock from './CodeBlock.svelte';

    /** @type {string} */
	export let text;

	/** @type {string} */
	export let containerClasses = "";

	/** @type {string} */
	export let containerStyles = "";

	/** @type {boolean} */
	export let rawText = false;

    let innerText = '';
	$: {
		innerText = !rawText ? replaceNewLine(replaceMarkdown(text || '')) : text;
	}
</script>

<div
	class={`markdown-container markdown-lite ${containerClasses || 'text-white'}`}
	style={`${containerStyles}`}
>
	<!-- {@html innerText} -->
	<SvelteMarkdown
		source={innerText}
		renderers={{
			code: CodeBlock
		}}
	/>
</div>