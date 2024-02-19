<script>
    import { Lightbox } from 'svelte-lightbox';

    /** @type {any} */
	export let message;
</script>

{#if message?.data && message.data.includes('data:image/png;base64,')}
<div class="image-wrap">
    <Lightbox transitionDuration={100}>
        <img src={message.data} alt={''} class="border rounded img-fluid" />
    </Lightbox>
</div>
{/if}