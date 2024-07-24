<script>
    import { marked } from 'marked';
    import { replaceMarkdown, replaceNewLine } from '$lib/helpers/http';

    /** @type {string} */
	export let text;

	/** @type {string} */
	export let containerClasses = "";

    let displayText = '';
	$: {
		const markedText = replaceNewLine(marked(replaceMarkdown(text || ''))?.toString());
		if (!!markedText && markedText.endsWith('<br>')) {
			const idx = markedText.lastIndexOf('<br>');
			displayText = markedText.substring(0, idx);
		} else {
            displayText = markedText;
        }
	}
</script>

<span class={`markdown-container ${containerClasses || 'text-white'}`}>
	{@html displayText}
</span>