<script>
    /** @type {any} */
    export let data;

    /** @type {string} */
    let beforeActiveRoundText = '';
    let afterActiveRoundText = '';
    let beforeDataValue = '';
    let afterDataValue = '';
    const defaultValue = '-';

    $: {
        beforeDataValue = buildDataValue(data?.before_value);
        afterDataValue = buildDataValue(data?.after_value);
        beforeActiveRoundText = buildActiveRoundText(data?.before_value, data?.before_active_rounds);
        afterActiveRoundText = buildActiveRoundText(data?.after_value, data?.after_active_rounds);
    }

    /** @param {any} value */
    function buildDataValue(value) {
        return value || defaultValue;
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

{#if beforeDataValue != defaultValue || afterDataValue != defaultValue}
<div class="log-element state-change-container">
    <div class="log-meta state-key text-danger">
        <div>
            <span><b>{`${data?.name}`}</b></span>
            {#if !!data?.source}
            <span class="state-source text-secondary">{`${data?.source}`}</span>
            {/if}
        </div>
    </div>
    <div class="log-content state-value-container">
        <div class="state-value">
            <div class="value">
                {beforeDataValue}
            </div>
            {#if !!beforeActiveRoundText}
            <div class="active-rounds">
                {`${beforeActiveRoundText}`}
            </div>
            {/if}
        </div>
        <div class="state-value text-warning">
            <div class="value">
                {afterDataValue}
            </div>
            {#if !!afterActiveRoundText}
            <div class="active-rounds">
                {`${afterActiveRoundText}`}
            </div>
            {/if}
        </div>
    </div>
</div>
{/if}