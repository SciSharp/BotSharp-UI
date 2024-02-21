<script>
	import { replaceNewLine } from "$lib/helpers/http";

    /** @type {any} */
    export let message;

    /** @type {boolean} */
    export let displayOptions = false;

    /** @type {(args0: string, args1: any) => any} */
    export let onConfirm;

    /**
	 * @param {any} e
     * @param {string} payload
	 */
    function handleConfirm(e, payload) {
        e.preventDefault();
        onConfirm && onConfirm(payload, message);
    }
</script>

<div class="ctext-wrap">
    <div class="flex-shrink-0 align-self-center">
        <div>{@html replaceNewLine(message?.text || '')}</div>
    </div>
</div>

{#if displayOptions && message?.buttons?.length > 0}
<div class="button-group">
    {#each message.buttons as button}
    <button class="btn btn-outline-primary btn-rounded btn-sm m-1" on:click={(e) => handleConfirm(e, button.payload)}>{button.title}</button>
    {/each}
</div>
{/if}