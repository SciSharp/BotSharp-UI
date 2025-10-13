<script>
	import Markdown from "$lib/common/markdown/Markdown.svelte";
	import { RichType } from "$lib/helpers/enums";
	import RcJsInterpreter from "./rc-js-interpreter.svelte";

    /** @type {import('$conversationTypes').ChatResponseModel?} */
    export let message;

    /** @type {string} */
    export let containerClasses = '';

    /** @type {string} */
    export let containerStyles = '';

    /** @type {string} */
    export let markdownClasses = '';

    $: text = message?.rich_content?.message?.text || message?.text || '';
</script>

{#if text}
    <div
        class={`ctext-wrap bg-primary ${containerClasses}`}
        style={`${containerStyles}`}
    >
        <div class="flex-shrink-0 align-self-center">
            {#if message?.rich_content?.message?.rich_type === RichType.ProgramCode
                && message?.rich_content?.message?.language === 'javascript'}
                <RcJsInterpreter message={message} scrollable />
            {:else if message?.rich_content?.message?.rich_type === RichType.ProgramCode}
                <Markdown containerClasses={markdownClasses} text={message?.text} rawText />
            {:else}
                <Markdown containerClasses={markdownClasses} text={text} rawText />
            {/if}
        </div>
    </div>
{/if}