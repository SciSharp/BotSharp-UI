<script>

    /** @type {any} */
    export let data;
</script>

<div class="log-element">
    <div class="log-meta state-key">
        <div><b>{`${data?.name}`}</b></div>
    </div>
    <div class="log-content state-value-container">
        <div class="state-value">
            <div>{`${data?.before_value || 'unknown'}`}</div>
        </div>
        <div class="state-value text-warning">
            <div>{`${data?.after_value || 'unknown'}`}</div>
        </div>
    </div>
</div>
