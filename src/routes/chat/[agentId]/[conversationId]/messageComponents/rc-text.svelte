<script>
	import FileDropZone from '$lib/common/FileDropZone.svelte';
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



<div class="file-drop-zone-container">
	<FileDropZone accept={'jpeg'} />
</div>

<style>
	.file-drop-zone-container {
		margin-top: 2px;
		max-width: 50vmin;
		max-height: 10%;
	}
</style>