<script>
	import { replaceNewLine } from '$lib/helpers/http';
	import { Renderer, marked } from 'marked';

	/** @type {any} */
	export let message;
	
	let displayText = '';
	$: {
		const text = replaceNewLine(marked(message?.text || '')?.toString());
		if (!!text && text.endsWith('<br>')) {
			const idx = text.lastIndexOf('<br>');
			displayText = text.substring(0, idx);
		} else {
			displayText = text;
		}
	}

</script>

<div class="ctext-wrap">
	<div class="flex-shrink-0 align-self-center">
		<span>{@html displayText}</span>
	</div>
</div>