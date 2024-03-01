<script>
    import { marked } from 'marked';
    import { replaceNewLine } from '$lib/helpers/http';

    /** @type {string} */
	export let text;

    let displayText = '';
	$: {
		const markedText = replaceNewLine(marked(text || '')?.toString());
		if (!!markedText && markedText.endsWith('<br>')) {
			const idx = markedText.lastIndexOf('<br>');
			displayText = markedText.substring(0, idx);
		} else {
            displayText = markedText;
        }
	}
</script>

<span class="markdown-container">
	{@html displayText}
</span>