<script>
	import Markdown from "$lib/common/markdown/Markdown.svelte";
	import { RichType } from "$lib/helpers/enums";
	import RcJsInterpreter from "./rc-js-interpreter.svelte";

    /**
     * @type {{
     *   message?: import('$conversationTypes').ChatResponseModel | null,
     *   containerClasses?: string,
     *   containerStyles?: string,
     *   markdownClasses?: string
     * }}
     */
    let {
        message = null,
        containerClasses = '',
        containerStyles = '',
        markdownClasses = ''
    } = $props();

    let text = $derived(message?.rich_content?.message?.text || message?.text || '');
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
            {:else}
                <Markdown containerClasses={markdownClasses} text={text} rawText />
            {/if}
        </div>
    </div>
{/if}