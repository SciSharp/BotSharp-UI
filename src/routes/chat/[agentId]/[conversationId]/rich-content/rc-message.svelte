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
</script>

<div
    class={`ctext-wrap bg-primary ${containerClasses}`}
    style={`${containerStyles}`}
>
	<div class="flex-shrink-0 align-self-center">
        <Markdown containerClasses={markdownClasses} text={message?.rich_content?.message?.text || message?.text || ''} rawText />
    </div>
</div>