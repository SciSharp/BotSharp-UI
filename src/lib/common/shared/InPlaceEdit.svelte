<script>
    import { createEventDispatcher, onMount } from 'svelte';
  
    /** @type {string} */
    export let value = '';

    /** @type {boolean} */
    export let required = true;

    /** @type {number} */
    export let maxLength = 30;

    /** @type {string} */
    export let placeholder = 'Please edit here...';
  
    const dispatch = createEventDispatcher();
    let editing = false;
    let original = '';
  
    onMount(() => {
        original = value;
    })
  
    function edit() {
        editing = true;
    }
  
    function submit() {
        editing = false;
        if (value != original) {
            dispatch('submit', value);
        }
    }

    /** @param {any} event */
    function handleInput(event) {
        dispatch('input', event);
    }

    /** @param {any} event */
    function keydown(event) {
        if (event.key == 'Escape') {
            event.preventDefault()
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
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <form on:submit|preventDefault={() => submit()} on:keydown={e => keydown(e)}>
        <input
            class="form-control"
            bind:value={value}
            {required}
            maxlength={maxLength}
            use:focus
            on:blur={() => submit()}
            on:input={handleInput}
        />
    </form>
{:else}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div style="width: fit-content; min-width: 30%;" class="clickable ellipsis" on:click={() => edit()}>
        {#if !!value?.trim()}
            <span>{value}</span>
        {:else}
            <span class="text-secondary fw-light">{placeholder}</span>
        {/if}
    </div>
{/if}  