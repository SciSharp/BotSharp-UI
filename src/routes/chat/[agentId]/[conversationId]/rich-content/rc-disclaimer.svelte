<script>
     /** @type {{ content: string }} */
     let { content } = $props();
</script>

<div class="rcd-box">
    {content}
</div>

<style>
    /* Post-action disclaimer (replaces .msg-disclaimer with subtle success styling) */
    .rcd-box {
        margin-top: 3px;
        padding: 5px 10px;
        border-radius: 5px;
        border: 1px solid color-mix(in srgb, var(--color-success, #34c38f) 35%, transparent);
        background-color: color-mix(in srgb, var(--color-success, #34c38f) 12%, transparent);
        font-size: 0.85em;
    }
</style>