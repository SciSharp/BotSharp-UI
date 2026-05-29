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
        element.select();
    }
</script>

{#if editing}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <form class="ipe-form" onsubmit={(e) => { e.preventDefault(); submit(); }} onkeydown={e => keydown(e)}>
        <input
            class="form-control ipe-input"
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
    <div
        class="ipe-display"
        title="Click to edit"
        onclick={() => edit()}
    >
        {#if !!value?.trim()}
            <span class="ipe-text">{value}</span>
        {:else}
            <span class="ipe-text ipe-placeholder">{placeholder}</span>
        {/if}
        <i class="mdi mdi-pencil-outline ipe-pencil" aria-hidden="true"></i>
    </div>
{/if}

<style>
    /* Display affordance — text reads as static copy, but a soft tinted
       pill, dashed underline, and fade-in pencil glyph signal that the
       value is editable on hover. */
    .ipe-display {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
        width: fit-content;
        min-width: 30%;
        max-width: 100%;
        padding: 0.125rem 0.5rem;
        border: 1px solid transparent;
        border-radius: 0.375rem;
        cursor: text;
        text-align: center;
        transition:
            background-color 0.15s ease,
            border-color 0.15s ease,
            color 0.15s ease;
    }

    .ipe-text {
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        border-bottom: 1px dashed transparent;
        text-align: center;
        transition: border-color 0.15s ease;
    }

    .ipe-placeholder {
        color: var(--color-secondary);
        font-weight: 300;
        font-style: italic;
    }

    .ipe-display:hover {
        background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
        border-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
    }
    .ipe-display:hover .ipe-text {
        border-bottom-color: color-mix(in srgb, var(--color-primary) 55%, transparent);
    }

    /* Pencil hint — invisible by default, fades in on hover so it does
       not steal space or attention while idle. */
    .ipe-pencil {
        flex-shrink: 0;
        font-size: 0.875rem;
        line-height: 1;
        color: var(--color-primary);
        opacity: 0;
        transform: translateX(-2px);
        transition: opacity 0.15s ease, transform 0.15s ease;
    }
    .ipe-display:hover .ipe-pencil {
        opacity: 0.8;
        transform: translateX(0);
    }

    /* Editing input — overrides Bootstrap's flat .form-control so it
       blends with the surrounding text and shows a primary-tinted focus
       ring instead of the default blue one. */
    .ipe-form {
        margin: 0;
        width: 100%;
        text-align: center;
    }
    .ipe-input.form-control {
        width: 100%;
        padding: 0.25rem 0.5rem;
        font: inherit;
        color: inherit;
        text-align: center;
        background-color: rgb(255 255 255);
        border: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
        border-radius: 0.375rem;
        box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .ipe-input.form-control:focus {
        border-color: var(--color-primary);
        outline: 0;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 22%, transparent);
    }

    /* Dark mode — bump tint strength and swap the input surface so the
       component remains legible on darker panels. */
    :global(.dark) .ipe-display:hover {
        background-color: color-mix(in srgb, var(--color-primary) 18%, transparent);
        border-color: color-mix(in srgb, var(--color-primary) 32%, transparent);
    }
    :global(.dark) .ipe-input.form-control {
        background-color: rgb(17 24 39);
        color: rgb(229 231 235);
        border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
    }
</style>