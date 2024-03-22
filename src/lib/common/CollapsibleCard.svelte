<script>
    import { createEventDispatcher } from 'svelte'
    import collapse from 'svelte-collapse';

    export let open = true;
    export let duration = 0.2;
    export let easing = 'ease';

    const dispatch = createEventDispatcher()

    function handleToggle () {
        open = !open
        if (open) {
            dispatch('open')
        }
        else {
            dispatch('close')
        }
    }
</script>

<div class='collapsible-card' class:open aria-expanded={open}>
    <button type="button" class='collapsible-card-header' on:click={handleToggle}>
        <slot name='header'/>
    </button>

    <div class='collapsible-card-body' use:collapse={{open, duration, easing}}>
        <slot name='body'/>
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