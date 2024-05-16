<script>
	import { EditorType, RichType } from "$lib/helpers/enums";
	import RcPlainOptions from "./rc-plain-options.svelte";
	import RcComplexOptions from "./rc-complex-options.svelte";
	import ChatAttachmentOptions from "../chat-image/chat-attachment-options.svelte";
	
    /** @type {import('$types').ChatResponseModel?} */
    export let message;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {(args0: string, args1: string) => any} */
    export let onConfirm = () => {};

    /** @type {boolean} */
    let isComplexElement = false;
    let isMultiSelect = false;

    /** @type {any[] | undefined} */
    let options = [];

    $: {
        const richType = message?.rich_content?.message?.rich_type;

        if (richType === RichType.QuickReply) {
            options = message?.rich_content?.message?.quick_replies;
        } else if (richType === RichType.Button || richType === RichType.Upload) {
            options = message?.rich_content?.message?.buttons;
        } else if (richType === RichType.MultiSelect) {
            options = message?.rich_content?.message?.options;
            isMultiSelect = true;
        } else if (richType === RichType.Generic) {
            options = message?.rich_content?.message?.elements;
            // @ts-ignore
            isComplexElement = message?.rich_content?.message?.elements?.some(x => x.buttons?.length > 0) || false;
        } else if (message?.rich_content?.editor === EditorType.File) {
            options = message?.rich_content?.message?.buttons;
        }
    }

    /**
     * @param {string} title
     * @param {string} payload
	 */
     function handleConfirm(title, payload) {
        onConfirm && onConfirm(title, payload);
    }
</script>

{#if message?.rich_content?.editor === EditorType.File}
    <ChatAttachmentOptions options={options} disabled={disabled} onConfirm={handleConfirm} />
{/if}

{#if message?.rich_content?.editor !== EditorType.File}
    {#if !isComplexElement}
        <RcPlainOptions options={options} isMultiSelect={isMultiSelect} disabled={disabled} onConfirm={handleConfirm} />
    {:else}
        <RcComplexOptions options={options} disabled={disabled} onConfirm={handleConfirm} />
    {/if}
{/if}