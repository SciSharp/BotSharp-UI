<script>
    /** @type {{ text: string, containerClasses?: string, containerStyles?: string, disableDefaultStyles?: boolean, close?: () => void }} */
    let {
        text,
        containerClasses = "",
        containerStyles = "",
        disableDefaultStyles = false,
        close = () => {}
    } = $props();

    /** @param {Event} e */
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
        <div
            class="bubble-delete clickable"
            role="button"
            tabindex="0"
            onclick={handleClose}
            onkeydown={e => e.key === 'Enter' && handleClose(e)}
        >
            <i class="mdi mdi-close"></i>
        </div>
        <div class="bubble-text">
            {text}
        </div>
    </div>
</div>
