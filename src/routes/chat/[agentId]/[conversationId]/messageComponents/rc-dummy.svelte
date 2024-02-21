<script>
	import { replaceNewLine } from "$lib/helpers/http";
	import RcOptions from "./rc-options.svelte";

    /** @type {any} */
    export let message;
    export let displayOptions = false;

    /** @type {(args0: string) => any} */
    export let onConfirm;

    let options = [
        {
            title: 'Option 1',
            payload: 'Option 1',
        },
        {
            title: 'Option 2',
            payload: 'Option 2',
        },
        {
            title: 'Option 3',
            payload: 'Option 3',
        },
    ];

    /**
	 * @param {any} payload
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

{#if displayOptions && options?.length > 0}
<RcOptions options={options} isMultiSelect onConfirm={handleConfirm} />
{/if}