<script>
	import { replaceNewLine } from "$lib/helpers/http";

    /** @type {any} */
    export let message;
    /** @type {(args0: string, args1: any) => any} */
     export let onClickOption;

    /**
	 * @param {any} e
     * @param {string} payload
	 */
    function handleButtonClick(e, payload) {
        e.preventDefault();
        onClickOption && onClickOption(payload, message);
    }
</script>

<div class="ctext-wrap">
    <div class="flex-shrink-0 align-self-center">
        <div>{@html replaceNewLine(message?.text || '')}</div>
    </div>
</div>

{#if message?.buttons?.length > 0}
<div class="button-group">
    {#each message.buttons as button}
    <button class="btn btn-outline-primary btn-rounded btn-sm m-1" on:click={(e) => handleButtonClick(e, button.payload)}>{button.title}</button>
    {/each}
</div>
{/if}