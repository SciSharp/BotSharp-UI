<script>
	import { replaceNewLine } from "$lib/helpers/http";

    /** @type {any} */
    export let message;

    /** @type {boolean} */
    export let displayOptions = false;

    /** @type {string[]} */
    let answers = [];

    /** @type {(args0: string, args1: any) => any} */
    export let onConfirm;


    /**
	 * @param {any} e
     * @param {number} index
	 */
     function clickOption(e, index) {
        e.preventDefault();
        
        console.log('answers: ', answers);
    }

    /**
	 * @param {any} e
     * @param {string} payload
	 */
    function handleConfirm(e, payload) {
        e.preventDefault();
        onConfirm && onConfirm(payload, message);
        reset();
    }

    function reset() {
        answers = [];
    }
</script>

<div class="ctext-wrap">
	<div class="flex-shrink-0 align-self-center">
        <span>{@html replaceNewLine(message?.text || '')}</span>
    </div>
</div>

{#if displayOptions && message?.options?.length > 0}
<div class="button-group">
    {#each message.options as option}
    <button class="btn btn-outline-primary btn-rounded btn-sm m-1" on:click={(e) => clickOption(e, option.payload)}>{option.title}</button>
    {/each}
    <button class="btn btn-outline-primary btn-rounded btn-sm m-1" disabled={false} on:click={(e) => handleConfirm(e, message)}>{'Continue'}</button>
</div>
{/if}