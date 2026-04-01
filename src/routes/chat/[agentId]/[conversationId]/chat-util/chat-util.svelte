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
    class={`${disableDefaultStyles ? '' : 'chat-util-trigger'} ${containerClasses}`}
    style={`${containerStyles}`}
>
    <ul class="list-inline mb-0">
        <li class="list-inline-item">
            <span>
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <i
                    class="bx bx-plus-circle clickable"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="More"
                    onclick={() => clickIcon()}
                ></i>
            </span>
        </li>
    </ul>
</div>