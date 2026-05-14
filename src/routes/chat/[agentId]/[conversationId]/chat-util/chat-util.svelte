<script>
    /**
     * @type {{
     *   disableDefaultStyles?: boolean,
     *   containerClasses?: string,
     *   containerStyles?: string,
     *   disabled?: boolean,
     *   onclick?: () => void
     * }}
     */
    let {
        disableDefaultStyles = false,
        containerClasses = '',
        containerStyles = '',
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
    class={`${disableDefaultStyles ? '' : 'cu-trigger'} ${containerClasses}`}
    style={`${containerStyles}`}
>
    <ul class="cu-list">
        <li class="cu-item">
            <span class="cu-glyph">
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <i
                    class="bx bx-plus-circle cu-icon"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="More"
                    onclick={() => clickIcon()}
                ></i>
            </span>
        </li>
    </ul>
</div>

<style>
    /* Replaces legacy .chat-util-trigger / .list-inline / .list-inline-item / .clickable */
    .cu-trigger {
        text-align: center;
    }
    .cu-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .cu-item {
        display: inline-block;
    }
    .cu-glyph {
        display: inline-block;
        padding: 0 0.25rem;
        line-height: 2.25rem;
        font-size: 200%;
        color: var(--color-primary);
    }
    .cu-icon {
        cursor: pointer;
    }
</style>