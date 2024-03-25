<script>
	import { RichType } from "$lib/helpers/enums";
	import Markdown from "$lib/common/Markdown.svelte";
	import RcOptions from "./rc-options.svelte";
	import RcGenericOptions from "./rc-generic-options.svelte";

    /** @type {any} */
    export let message;

    /** @type {boolean} */
    export let displayExtraElements = false;

    /** @type {boolean} */
    export let disableOption = false;

    /** @type {(args0: string, args1: string) => any} */
    export let onConfirm = () => {};

    /**
     * @param {string} title
     * @param {string} payload
	 */
    function handleConfirm(title, payload) {
        onConfirm && onConfirm(title, payload);
    }
</script>

<div class="ctext-wrap">
	<div class="flex-shrink-0 align-self-center">
        <Markdown text={message?.rich_content?.message?.text || message?.text} />
    </div>
</div>

{#if displayExtraElements}
    {#if message?.rich_content?.message?.rich_type === RichType.QuickReply}
	<RcOptions options={message?.rich_content?.message?.quick_replies} disableOption={disableOption} onConfirm={handleConfirm} />
    {:else if message?.rich_content?.message?.rich_type === RichType.Button}
    <RcOptions options={message?.rich_content?.message?.buttons} disableOption={disableOption} onConfirm={handleConfirm} />
    {:else if message?.rich_content?.message?.rich_type === RichType.MultiSelect}
    <RcOptions options={message?.rich_content?.message?.options} isMultiSelect disableOption={disableOption} onConfirm={handleConfirm} />
    {:else if message?.rich_content?.message?.rich_type === RichType.Generic}
    <RcGenericOptions options={message?.rich_content?.message?.elements} disableOption={disableOption} onConfirm={handleConfirm} />
    {/if}
{/if}