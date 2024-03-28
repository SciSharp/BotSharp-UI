<script>
	import { RichType } from "$lib/helpers/enums";
	import Markdown from "$lib/common/Markdown.svelte";
	import RcPlainOptions from "./rc-plain-options.svelte";
	import RcComplexOptions from "./rc-complex-options.svelte";

    /** @type {any} */
    export let message;

    /** @type {boolean} */
    export let displayExtraElements = false;

    /** @type {boolean} */
    export let disableOption = false;

    /** @type {(args0: string, args1: string) => any} */
    export let onConfirm = () => {};

    /** @type {boolean} */
    let isComplexElement = false;

    /**
     * @param {string} title
     * @param {string} payload
	 */
    function handleConfirm(title, payload) {
        onConfirm && onConfirm(title, payload);
    }

    $: {
        const isGeneric = message?.rich_content?.message?.rich_type === RichType.Generic;
        // @ts-ignore
        const hasSuboptions = message?.rich_content?.message?.elements?.some(x => x.buttons?.length > 0) || false;
        console.log(isGeneric, hasSuboptions);
        isComplexElement = isGeneric && hasSuboptions;
    }
</script>

<div class="ctext-wrap">
	<div class="flex-shrink-0 align-self-center">
        <Markdown text={message?.rich_content?.message?.text || message?.text} />
    </div>
</div>

{#if displayExtraElements}
    {#if message?.rich_content?.message?.rich_type === RichType.QuickReply}
	    <RcPlainOptions options={message?.rich_content?.message?.quick_replies} disableOption={disableOption} onConfirm={handleConfirm} />
    {:else if message?.rich_content?.message?.rich_type === RichType.Button}
        <RcPlainOptions options={message?.rich_content?.message?.buttons} disableOption={disableOption} onConfirm={handleConfirm} />
    {:else if message?.rich_content?.message?.rich_type === RichType.MultiSelect}
        <RcPlainOptions options={message?.rich_content?.message?.options} isMultiSelect disableOption={disableOption} onConfirm={handleConfirm} />
    {:else if message?.rich_content?.message?.rich_type === RichType.Generic}
        {#if isComplexElement}
            <RcComplexOptions options={message?.rich_content?.message?.elements} disableOption={disableOption} onConfirm={handleConfirm} />
        {:else}
            <RcPlainOptions options={message?.rich_content?.message?.elements} disableOption={disableOption} onConfirm={handleConfirm} />
        {/if}
    {/if}
{/if}