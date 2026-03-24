<script>
    import collapse from 'svelte-collapse';

    let {
        open = $bindable(true),
        duration = 0.2,
        easing = 'ease',
        onopen = /** @type {(() => void) | undefined} */ (undefined),
        onclose = /** @type {(() => void) | undefined} */ (undefined),
        header,
        body
    } = $props();

    function handleToggle () {
        open = !open;
        if (open) {
            onopen?.();
        }
        else {
            onclose?.();
        }
    }
</script>

<div class='collapsible-card' class:open aria-expanded={open}>
    <button type="button" class='collapsible-card-header' onclick={handleToggle}>
        {@render header?.()}
    </button>

    <div class='collapsible-card-body' use:collapse={{open, duration, easing}}>
        {@render body?.()}
    </div>
</div>

<style>
    .collapsible-card {
        margin-top: 10px;
        margin-bottom: 10px;
    }
    .collapsible-card-header {
        cursor: pointer;
        user-select: none;
        width: 100%;
        text-align: left;
    }
    button {
        background: transparent;
        border: none !important;
    }
</style>