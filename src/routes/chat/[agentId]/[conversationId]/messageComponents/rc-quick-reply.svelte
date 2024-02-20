<script>
	import { replaceNewLine } from '$lib/helpers/http';

	/** @type {import('$types').QuickReplyMessage} */
	export let message;

	/** @type {(arg0: string, arg1: import('$types').QuickReplyMessage) => void} */
	export let onClickOption;

	/**
	 * @param {any} e
	 * @param {string} payload
	 */
	async function handleButtonClick(e, payload) {
		e.preventDefault();
		onClickOption && onClickOption(payload, message);
	}
</script>

<div class="ctext-wrap">
	<div class="flex-shrink-0 align-self-center">
        <span>{@html replaceNewLine(message?.text || '')}</span>
    </div>
</div>

{#if message?.quick_replies?.length > 0}
{#each message.quick_replies as reply}
<div class="button-group">
	<button class="btn btn-primary btn-rounded btn-sm m-1" on:click={(e) => handleButtonClick(e, reply.payload)}>{reply.title}</button>
</div>
{/each}
{/if}