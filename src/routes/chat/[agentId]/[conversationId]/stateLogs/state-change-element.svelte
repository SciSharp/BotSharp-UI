<script>

    /** @type {any} */
    export let data;

    /** @type {string} */
    let beforeActiveRoundText = '';
    let afterActiveRoundText = '';

    $: {
        beforeActiveRoundText = buildActiveRoundText(data?.before_value, data?.before_active_rounds);
        afterActiveRoundText = buildActiveRoundText(data?.after_value, data?.after_active_rounds);
    }

    /**
     * @param {any} value
	 * @param {any} activeRounds
	 */
    function buildActiveRoundText(value, activeRounds) {
        let text = '';

        if (!!!value) {
            return text;
        }

        if (activeRounds > 1) {
            text = `(active rounds: ${activeRounds})`;
        } else if (activeRounds == 1) {
            text = `(active round: ${activeRounds})`;
        }

        return text;
    }
</script>

<div class="log-element state-change-container">
    <div class="log-meta state-key">
        <div><b>{`${data?.name}`}</b></div>
    </div>
    <div class="log-content state-value-container">
        <div class="state-value">
            <div class="value">
                {`${data?.before_value || 'unknown'}`}
            </div>
            {#if !!beforeActiveRoundText}
            <div class="active-rounds">
                {`${beforeActiveRoundText}`}
            </div>
            {/if}
        </div>
        <div class="state-value text-warning">
            <div class="value">
                {`${data?.after_value || 'unknown'}`}
            </div>
            {#if !!afterActiveRoundText}
            <div class="active-rounds">
                {`${afterActiveRoundText}`}
            </div>
            {/if}
        </div>
    </div>
</div>
