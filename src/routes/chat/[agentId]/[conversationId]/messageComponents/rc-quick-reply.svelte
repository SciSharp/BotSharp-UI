<script>
	import { replaceNewLine } from '$lib/helpers/http';

	/** @type {any} */
	export let message;

	/** @type {boolean} */
    export let displayOptions = false;

	/** @type {(arg0: string, arg1: any) => void} */
	export let onConfirm;

	/**
	 * @param {any} e
	 * @param {string} payload
	 */
	async function handleConfirm(e, payload) {
		e.preventDefault();
		onConfirm && onConfirm(payload, message);
	}
</script>

<div class="ctext-wrap">
	<div class="flex-shrink-0 align-self-center">
        <span>{@html replaceNewLine(message?.text || '')}</span>
    </div>
</div>

{#if displayOptions && message?.quick_replies?.length > 0}
{#each message.quick_replies as reply}
<div class="button-group">
	<button class="btn btn-primary btn-rounded btn-sm m-1" on:click={(e) => handleConfirm(e, reply.payload)}>{reply.title}</button>
</div>
{/each}
{/if}