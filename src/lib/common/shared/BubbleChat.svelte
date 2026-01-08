<script>
    /** @type {string} */
    export let text;

    /** @type {() => void} */
    export let close = () => {};

    /** @type {string} */
    export let containerClasses = "";

    /** @type {string} */
    export let containerStyles = "";

    /** @type {boolean} */
    export let disableDefaultStyles = false;

    
    /** @param {any} e */
    function handleClose(e) {
        e.preventDefault();
        close?.();
    }
</script>

<div
    class="{disableDefaultStyles ? '' : 'chat-bubble-container'} {containerClasses}"
    style={`${containerStyles}`}
>
    <div class="chat-bubble">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            class="bubble-delete clickable"
            on:click={e => handleClose(e)}
        >
            <i class="mdi mdi-close" />
        </div>
        <div class="bubble-text">
            {text}
        </div>
    </div>
</div>
