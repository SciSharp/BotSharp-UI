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
    class={`${disableDefaultStyles ? '' : 'chat-util-trigger'} ${containerClasses}`}
    style={`${containerStyles}`}
>
    <ul class="list-inline mb-0">
        <li class="list-inline-item">
            <span>
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <i
                    class="bx bx-pencil clickable"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Zoom in"
                    onclick={() => clickIcon()}
                ></i>
            </span>
        </li>
    </ul>
</div>