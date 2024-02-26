<script>
	import RcMarkdown from './rc-markdown.svelte';

	/** @type {any} */
	export let message;
</script>

<RcMarkdown text={message?.text} />