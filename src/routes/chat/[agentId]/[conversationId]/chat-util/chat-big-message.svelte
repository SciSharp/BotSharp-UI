<script>
    /**
     * @type {{
     *   containerClasses?: string,
     *   containerStyles?: string,
     *   disableDefaultStyles?: boolean,
     *   disabled?: boolean,
     *   onclick?: () => void
     * }}
     */
    let {
        containerClasses = '',
        containerStyles = '',
        disableDefaultStyles = false,
        disabled = false,
        onclick
    } = $props();

    function clickIcon() {
        if (disabled) {
            return;
        }
        onclick?.();
    }
</script>

<div
    class={`${disableDefaultStyles ? '' : 'cbm-trigger'} ${containerClasses}`}
    style={`${containerStyles}`}
>
    <ul class="cbm-list">
        <li class="cbm-item">
            <span class="cbm-glyph">
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <i
                    class="bx bx-pencil cbm-icon"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Zoom in"
                    onclick={() => clickIcon()}
                ></i>
            </span>
        </li>
    </ul>
</div>

<style>
    /* Replaces legacy .chat-util-trigger / .list-inline / .list-inline-item / .clickable */
    .cbm-trigger {
        text-align: center;
    }
    .cbm-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .cbm-item {
        display: inline-block;
    }
    .cbm-glyph {
        display: inline-block;
        padding: 0 0.25rem;
        line-height: 2.25rem;
        font-size: 200%;
        color: var(--color-primary);
    }
    .cbm-icon {
        cursor: pointer;
    }
</style>