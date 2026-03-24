<script>
    import { onMount } from 'svelte';

    let {
        value = $bindable(''),
        required = true,
        maxLength = 30,
        placeholder = 'Please edit here...',
        onSubmit = /** @type {((val: string) => void) | undefined} */ (undefined),
        onInput = /** @type {((event: any) => void) | undefined} */ (undefined)
    } = $props();

    let editing = $state(false);
    let original = '';

    onMount(() => {
        original = value;
    });

    function edit() {
        editing = true;
    }

    function submit() {
        editing = false;
        if (value != original) {
            onSubmit?.(value);
        }
    }

    /** @param {any} event */
    function handleInput(event) {
        onInput?.(event);
    }

    /** @param {any} event */
    function keydown(event) {
        if (event.key == 'Escape') {
            event.preventDefault();
            value = original;
            editing = false;
        }
    }

    /** @param {HTMLInputElement} element */
    function focus(element) {
        element.focus();
    }
</script>

{#if editing}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <form onsubmit={(e) => { e.preventDefault(); submit(); }} onkeydown={e => keydown(e)}>
        <input
            class="form-control"
            bind:value={value}
            {required}
            maxlength={maxLength}
            use:focus
            onblur={() => submit()}
            oninput={handleInput}
        />
    </form>
{:else}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div style="width: fit-content; min-width: 30%;" class="clickable ellipsis" onclick={() => edit()}>
        {#if !!value?.trim()}
            <span>{value}</span>
        {:else}
            <span class="text-secondary fw-light">{placeholder}</span>
        {/if}
    </div>
{/if}