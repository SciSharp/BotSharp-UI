<script>
	import Markdown from "$lib/common/markdown/Markdown.svelte";

    /** @type {any} */
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
            <Markdown containerClasses={markdownClasses} text={text} rawText />
        </div>
    </div>
{/if}