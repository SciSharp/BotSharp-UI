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

