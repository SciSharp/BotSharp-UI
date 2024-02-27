<script>
	import RcMarkdown from './rc-markdown.svelte';
	import RcOptions from "./rc-options.svelte";

	/** @type {any} */
	export let message;

	/** @type {any} */
	export let richContent;

	/** @type {boolean} */
    export let displayExtraElements = false;

	/** @type {boolean} */
    export let disableOption = false;

	/** @type {(arg0: string) => void} */
	export let onConfirm;

	/**
	 * @param {string} payload
	 */
	async function handleConfirm(payload) {
		onConfirm && onConfirm(payload);
	}
</script>


<RcMarkdown text={richContent?.message?.text || message?.text} />

{#if displayExtraElements}
	{#if richContent?.message?.quick_replies?.length > 0}
	<RcOptions options={richContent?.message?.quick_replies} disableOption={disableOption} onConfirm={handleConfirm} />
	{/if}
{/if}