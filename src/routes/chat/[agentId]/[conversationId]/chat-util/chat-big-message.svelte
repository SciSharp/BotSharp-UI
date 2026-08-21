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

