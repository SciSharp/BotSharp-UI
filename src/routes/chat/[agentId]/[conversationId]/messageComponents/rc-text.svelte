<script>
	import RcMarkdown from './rc-markdown.svelte';

	/** @type {any} */
	export let message;

	/** @type {any} */
	export let richContent;

	/** @type {boolean} */
	export let displayExtraElements = false;
</script>

<RcMarkdown text={richContent?.message?.text || message?.text} />

<!-- {#if displayExtraElements}
	{#if message?.function === 'upload_attachments'}
	{/if}
{/if} -->