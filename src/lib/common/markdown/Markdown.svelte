<script>
	import { marked } from 'marked';
    import { replaceMarkdown, replaceNewLine } from '$lib/helpers/http';

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