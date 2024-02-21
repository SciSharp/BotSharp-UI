<script>
	import { replaceNewLine } from '$lib/helpers/http';
	/** @type {any} */
	export let message;
</script>

<div class="ctext-wrap">
	<div class="flex-shrink-0 align-self-center">
		<span>{@html replaceNewLine(message?.text || '')}</span>
	</div>
</div>