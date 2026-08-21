<script>
	import { scrollToBottom } from '$lib/helpers/utils/common';

    const maxLength = 4096;
    const limit = 10;

    /**
     * @type {{
     *   states?: import('$commonTypes').KeyValuePair[],
     *   disabled?: boolean
     * }}
     */
    let {
        states = $bindable([]),
        disabled = false
    } = $props();

    /** @type {HTMLElement} */
    let scrollContainer;

    /** @param {number} idx */
    function removeState(idx) {
        if (disabled) return;

        states = states.filter((_, index) => index !== idx);
    }

    function addState() {
        states = [
            ...states,
            { key: '', value: ''}
        ];
        scrollToBottom(scrollContainer);
    }
</script>


<div class="flex flex-col py-3">
    <div class="grid grid-cols-[1fr_1fr_auto] gap-2 px-1 pb-1">
        <div class="text-xs font-semibold uppercase tracking-wider text-primary">{'Name'}</div>
        <div class="text-xs font-semibold uppercase tracking-wider text-primary">{'Value'}</div>
        <div class="w-5"></div>
    </div>
    <div class="thin-scrollbar flex max-h-[200px] flex-col gap-2 overflow-y-auto px-1 pb-2" bind:this={scrollContainer}>
        {#each states as state, idx}
            <div class="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                <input
                    type="text"
                    class="form-control"
                    name={`state-key-${idx}`}
                    bind:value={state.key}
                    maxlength={maxLength}
                    disabled={disabled}
                    placeholder="Enter a name"
                />
                <input
                    type="text"
                    class="form-control"
                    name={`state-value-${idx}`}
                    bind:value={state.value}
                    maxlength={maxLength}
                    disabled={disabled}
                    placeholder="Enter a value"
                />
                <button
                    type="button"
                    class="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-danger/15 text-danger transition-all hover:scale-105 hover:bg-danger/25 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={disabled}
                    aria-label="Remove state"
                    title="Remove"
                    onclick={() => removeState(idx)}
                >
                    <i class="bx bxs-no-entry text-base leading-none"></i>
                </button>
            </div>
        {/each}
    </div>
    {#if states.length < limit}
        <div class="mt-2 text-center">
            <button
                type="button"
                class="btn btn-link inline-flex items-center gap-1"
                disabled={disabled}
                onclick={() => addState()}
            >
                <i class="mdi mdi-plus text-base leading-none"></i>
                Add
            </button>
        </div>
    {/if}
</div>