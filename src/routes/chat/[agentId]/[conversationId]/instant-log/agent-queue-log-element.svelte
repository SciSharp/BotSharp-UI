<script>
    /** @type {{ data: any }} */
    let { data } = $props();
</script>

<div class="aql-element">
    <div class="aql-content">
        <span class="aql-warn">{data?.log}</span>
    </div>
</div>

<style>
    /* Outer row (replaces .log-element + .queue-change-container) */
    .aql-element {
        margin: 5px 0;
        padding: 0 10px;
    }

    /* Centered content line (replaces .log-content under .queue-change-container) */
    .aql-content {
        text-align: center;
        font-size: 15px;
        margin: 2px 0;
        color: rgb(255 255 255);
    }

    /* Warning-colored log text (replaces Bootstrap .text-warning) */
    .aql-warn {
        color: var(--color-warning, #f1b44c);
    }
</style>