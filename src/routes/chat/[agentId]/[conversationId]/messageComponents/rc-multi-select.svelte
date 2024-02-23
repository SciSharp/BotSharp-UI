<script>
	import { replaceNewLine } from "$lib/helpers/http";
    import RcOptions from "./rc-options.svelte";

    /** @type {any} */
    export let message;

    /** @type {boolean} */
    export let displayOptions = false;

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

<div class="ctext-wrap">
	<div class="flex-shrink-0 align-self-center">
        <span>{@html replaceNewLine(message?.text || '')}</span>
    </div>
</div>

{#if displayOptions && message?.options?.length > 0}
<RcOptions options={message.options} isMultiSelect disableOption={disableOption} onConfirm={handleConfirm} />
{/if}