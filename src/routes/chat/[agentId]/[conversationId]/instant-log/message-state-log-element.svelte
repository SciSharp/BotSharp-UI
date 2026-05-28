<script>
    /** @type {{ data: any }} */
    let { data } = $props();

    const defaultValue = '-';

    let collapsed = $state(true);

    /** @param {KeyboardEvent} e @param {() => void} fn */
    function handleKey(e, fn) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fn();
        }
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
        <div
            class="mss-state-value"
            class:mss-state-value-collapsed={collapsed}
            role="button"
            tabindex="0"
            title={collapsed ? 'Click to expand' : 'Click to collapse'}
            onclick={() => (collapsed = !collapsed)}
            onkeydown={(e) => handleKey(e, () => (collapsed = !collapsed))}
        >
            <div class="mss-value">
                {beforeDataValue}
            </div>
            {#if !!beforeActiveRoundText && !collapsed}
            <div class="mss-active-rounds">
                {`${beforeActiveRoundText}`}
            </div>
            {/if}
        </div>
        <div
            class="mss-state-value mss-state-value-warn"
            class:mss-state-value-collapsed={collapsed}
            role="button"
            tabindex="0"
            title={collapsed ? 'Click to expand' : 'Click to collapse'}
            onclick={() => (collapsed = !collapsed)}
            onkeydown={(e) => handleKey(e, () => (collapsed = !collapsed))}
        >
            <div class="mss-value">
                {afterDataValue}
            </div>
            {#if !!afterActiveRoundText && !collapsed}
            <div class="mss-active-rounds">
                {`${afterActiveRoundText}`}
            </div>
            {/if}
        </div>
    </div>
</div>
{/if}

