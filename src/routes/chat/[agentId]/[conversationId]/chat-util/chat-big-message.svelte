<script>
	import { createEventDispatcher } from "svelte";

    const svelteDispatch = createEventDispatcher();

    /** @type {string} */
    export let containerClasses = "";

    /** @type {string} */
    export let containerStyles = "";

    /** @type {boolean} */
    export let disabled = false;

    function clickIcon() {
        if (disabled) {
            return;
        }
        svelteDispatch("click")
    }
</script>

<div
    class={`${containerClasses}`}
    style={`${containerStyles}`}
>
    <span>
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <i
            class="bx bx-zoom-in clickable"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Zoom in"
            on:click={() => clickIcon()}
        />
    </span>
</div>