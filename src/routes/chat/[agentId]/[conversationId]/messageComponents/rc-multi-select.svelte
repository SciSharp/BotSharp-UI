<script>
	import { replaceNewLine } from "$lib/helpers/http";

    /** @type {any} */
    export let message;
    /** @type {(args0: string) => any} */
    export let onClickOption;

    /**
	 * @param {any} e
     * @param {string} payload
	 */
    function handleButtonClick(e, payload) {
        e.preventDefault();
        onClickOption && onClickOption(payload);
    }
</script>

<div class="ctext-wrap">
	<div class="flex-shrink-0 align-self-center">
        <span>{@html replaceNewLine(message?.text || '')}</span>
    </div>
</div>

{#if message?.options?.length > 0}
<div class="button-group">
    {#each message.options as option}
    <button class="btn btn-outline-primary btn-rounded btn-sm m-1" on:click={(e) => handleButtonClick(e, option.payload)}>{option.title}</button>
    {/each}
</div>
{/if}