<!--
	Options and attachments only. An EMBEDDING is deliberately not handled here any more: this
	component renders the LAST bot message's rich content in the composer area, and a panel drawn
	there is detached from the message that produced it and vanishes as soon as another message
	arrives. Embeddings are rendered per message in chat-box.svelte instead — see the note there.
-->
<script>
	import { EditorType, RichType } from "$lib/helpers/enums";
	import RcPlainOptions from "./rc-plain-options.svelte";
	import RcComplexOptions from "./rc-complex-options.svelte";
	import ChatAttachmentOptions from "../chat-util/chat-attachment-options.svelte";

    /**
     * @type {{
     *   message?: import('$conversationTypes').ChatResponseModel | null,
     *   disabled?: boolean,
     *   onConfirm?: (args0: string, args1: string) => any
     * }}
     */
    let {
        message = null,
        disabled = false,
        onConfirm = () => {}
    } = $props();

    let resolvedOptions = $derived.by(() => {
        const richType = message?.rich_content?.message?.rich_type;

        if (richType === RichType.QuickReply) {
            return { options: message?.rich_content?.message?.quick_replies, isMultiSelect: false, isComplexElement: false };
        } else if (richType === RichType.Button || richType === RichType.Upload) {
            return { options: message?.rich_content?.message?.buttons, isMultiSelect: false, isComplexElement: false };
        } else if (richType === RichType.MultiSelect) {
            return { options: message?.rich_content?.message?.options, isMultiSelect: true, isComplexElement: false };
        } else if (richType === RichType.Generic) {
            const elements = message?.rich_content?.message?.elements;
            // @ts-ignore
            const isComplex = elements?.some(x => x.buttons?.length > 0) || false;
            return { options: elements, isMultiSelect: false, isComplexElement: isComplex };
        } else if (message?.rich_content?.editor === EditorType.File) {
            return { options: message?.rich_content?.message?.buttons, isMultiSelect: false, isComplexElement: false };
        }
        return { options: [], isMultiSelect: false, isComplexElement: false };
    });

    /**
     * @param {string} title
     * @param {string} payload
	 */
     function handleConfirm(title, payload) {
        onConfirm?.(title, payload);
    }
</script>


{#if message?.rich_content?.editor === EditorType.File}
    <ChatAttachmentOptions options={resolvedOptions.options} disabled={disabled} onConfirm={(title, payload) => handleConfirm(title, payload)} />
{:else if !resolvedOptions.isComplexElement}
    <RcPlainOptions options={resolvedOptions.options} isMultiSelect={resolvedOptions.isMultiSelect} disabled={disabled} onConfirm={(title, payload) => handleConfirm(title, payload)} />
{:else}
    <RcComplexOptions options={resolvedOptions.options} disabled={disabled} onConfirm={(title, payload) => handleConfirm(title, payload)} />
{/if}