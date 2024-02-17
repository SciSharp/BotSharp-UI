<script>
    /** @type {any} */
	export let message;
</script>

{#if message?.data && message.data.includes('data:image/png;base64,')}
<div class="image-wrap">
    <img src={"https://media.istockphoto.com/id/1417080439/photo/water-drop-splash-on-the-blue-background.jpg?s=2048x2048&w=is&k=20&c=2a4WKSi3YHDi1-orR-7nTDph5AaH1KbbVdxM79AzxEs="} alt="" class="border rounded img-fluid"/>
</div>
{/if}