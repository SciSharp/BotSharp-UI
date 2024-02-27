<script>
	import RcMarkdown from "./rc-markdown.svelte";
    import RcOptions from "./rc-options.svelte";

    /** @type {any} */
    export let message;

    /** @type {any} */
	export let richContent;

    /** @type {boolean} */
    export let displayExtraElements = false;

    /** @type {boolean} */
    export let disableOption = false;

    /** @type {(args0: string) => any} */
    export let onConfirm;

    /**
     * @param {string} payload
	 */
    function handleConfirm(payload) {
        onConfirm && onConfirm(payload);
    }
</script>


<RcMarkdown text={richContent?.message?.text || message?.text} />

{#if displayExtraElements}
    {#if richContent?.message?.options?.length > 0}
    <RcOptions options={richContent?.message?.options} isMultiSelect disableOption={disableOption} onConfirm={handleConfirm} />
    {/if}
{/if}