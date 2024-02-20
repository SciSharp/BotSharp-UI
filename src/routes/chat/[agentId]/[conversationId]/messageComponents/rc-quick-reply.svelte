<script>
	import { replaceNewLine } from '$lib/helpers/http';

	/** @type {import('$types').QuickReplyMessage} */
	export let message;

	/** @type {(arg0: string, arg1: import('$types').QuickReplyMessage) => void} */
	export let onClickQuickReply;

	/**
	 * @param {any} e
	 * @param {string} payload
	 */
	async function handleQuickReplyClick(e, payload) {
		e.preventDefault();
		onClickQuickReply && onClickQuickReply(payload, message);
	}
</script>

<span>{@html replaceNewLine(message.text)}</span>
<div class="fixed-bottom p-2 text-center" style="margin-bottom: 10vh;">
{#each message.quick_replies as reply}
<button class="btn btn-primary btn-rounded btn-sm m-1" on:click={(e) => handleQuickReplyClick(e, reply.payload)}>{reply.title}</button>
{/each}
</div>