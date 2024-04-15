<script>
	import { RichType } from "$lib/helpers/enums";
	import RcPlainOptions from "./rc-plain-options.svelte";
	import RcComplexOptions from "./rc-complex-options.svelte";
	
    /** @type {any} */
    export let message;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {(args0: string, args1: string) => any} */
    export let onConfirm = () => {};

    /** @type {boolean} */
    let isComplexElement = false;
    let isMultiSelect = false;

    /** @type {any[]} */
    let options = [];

    $: {
        const richType = message?.rich_content?.message?.rich_type;

        if (richType === RichType.QuickReply) {
            options = message?.rich_content?.message?.quick_replies;
        } else if (richType === RichType.Button) {
            options = message?.rich_content?.message?.buttons;
        } else if (richType === RichType.MultiSelect) {
            options = message?.rich_content?.message?.options;
            isMultiSelect = true;
        } else if (richType === RichType.Generic) {
            options = message?.rich_content?.message?.elements;
            // @ts-ignore
            isComplexElement = message?.rich_content?.message?.elements?.some(x => x.buttons?.length > 0) || false;
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

{#if !isComplexElement}
    <RcPlainOptions options={options} isMultiSelect={isMultiSelect} disabled={disabled} onConfirm={handleConfirm} />
{:else}
    <RcComplexOptions options={options} disabled={disabled} onConfirm={handleConfirm} />
{/if}