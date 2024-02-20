<script>
	import { replaceNewLine } from '$lib/helpers/http';
	/** @type {import('$types').TextMessage} */
	export let message;
</script>

<span>{@html replaceNewLine(message.text)}</span>
