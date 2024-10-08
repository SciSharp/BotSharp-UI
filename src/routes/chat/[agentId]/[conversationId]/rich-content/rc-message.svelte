<script>
	import Markdown from "$lib/common/Markdown.svelte";

    /** @type {any} */
    export let message;
</script>

<div class="ctext-wrap bg-primary">
	<div class="flex-shrink-0 align-self-center">
        <Markdown text={message?.rich_content?.message?.text || message?.text} rawText />
    </div>
</div>