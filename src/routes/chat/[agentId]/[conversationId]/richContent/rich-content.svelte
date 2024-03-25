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

    /** @type {(args0: string) => any} */
    export let onConfirm = () => {};

    /**
     * @param {string} answer
	 */
    function handleConfirm(answer) {
        onConfirm && onConfirm(answer);
    }
</script>

<div class="ctext-wrap">
	<div class="flex-shrink-0 align-self-center">
        <Markdown text={message?.rich_content?.message?.text || message?.text} />
    </div>
</div>

{#if displayExtraElements}
    {#if message?.rich_content?.message?.rich_type === RichType.QuickReply}
	<RcOptions options={message?.rich_content?.message?.quick_replies} fillPostback={message?.rich_content?.fill_postback} disableOption={disableOption} onConfirm={handleConfirm} />
    {:else if message?.rich_content?.message?.rich_type === RichType.Button}
    <RcOptions options={message?.rich_content?.message?.buttons} fillPostback={message?.rich_content?.fill_postback} disableOption={disableOption} onConfirm={handleConfirm} />
    {:else if message?.rich_content?.message?.rich_type === RichType.MultiSelect}
    <RcOptions options={message?.rich_content?.message?.options} isMultiSelect fillPostback={message?.rich_content?.fill_postback} disableOption={disableOption} onConfirm={handleConfirm} />
    {:else if message?.rich_content?.message?.rich_type === RichType.Generic}
    <RcGenericOptions options={message?.rich_content?.message?.elements} disableOption={disableOption} onConfirm={handleConfirm} />
    {/if}
{/if}