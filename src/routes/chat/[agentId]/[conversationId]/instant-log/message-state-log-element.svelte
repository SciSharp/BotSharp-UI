<script>
    /** @type {{ data: any }} */
    let { data } = $props();

    const defaultValue = '-';

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

        if (!value) {
            return text;
        }

        if (activeRounds > 1) {
            text = `(active rounds: ${activeRounds})`;
        } else if (activeRounds == 1) {
            text = `(active round: ${activeRounds})`;
        }

        return text;
    }

    let beforeDataValue = $derived(buildDataValue(data?.before_value));
    let afterDataValue = $derived(buildDataValue(data?.after_value));
    let beforeActiveRoundText = $derived(buildActiveRoundText(data?.before_value, data?.before_active_rounds));
    let afterActiveRoundText = $derived(buildActiveRoundText(data?.after_value, data?.after_active_rounds));
</script>

{#if beforeDataValue != defaultValue || afterDataValue != defaultValue}
<div class="mss-element">
    <div class="mss-meta mss-state-key">
        <div>
            <span><b>{`${data?.name}`}</b></span>
            {#if !!data?.source}
            <span class="mss-state-source">{`${data?.source}`}</span>
            {/if}
        </div>
    </div>
    <div class="mss-content">
        <div class="mss-state-value">
            <div class="mss-value">
                {beforeDataValue}
            </div>
            {#if !!beforeActiveRoundText}
            <div class="mss-active-rounds">
                {`${beforeActiveRoundText}`}
            </div>
            {/if}
        </div>
        <div class="mss-state-value mss-state-value-warn">
            <div class="mss-value">
                {afterDataValue}
            </div>
            {#if !!afterActiveRoundText}
            <div class="mss-active-rounds">
                {`${afterActiveRoundText}`}
            </div>
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
    /* Outer row (replaces .log-element + .state-change-container) */
    .mss-element {
        margin: 0 0 5px 0;
        padding-left: 10px;
    }

    /* Key row (replaces .log-meta.state-key.text-danger) */
    .mss-meta {
        font-size: 15px;
        color: rgb(255 255 255);
    }
    .mss-state-key {
        color: var(--color-danger, #ef4444);
    }
    .mss-state-source {
        font-size: 12px;
        color: var(--color-secondary);
        margin-left: 0.375rem;
    }

    /* Before/after value pair (replaces .log-content + .state-value-container) */
    .mss-content {
        font-size: 17px;
        color: rgb(255 255 255);
        display: flex;
        flex-wrap: wrap;
    }
    .mss-state-value {
        min-width: 50%;
        font-size: 15px;
    }
    .mss-state-value-warn {
        color: var(--color-warning, #f1b44c);
    }
    .mss-active-rounds {
        font-size: 12px;
    }
</style>