<script>
    import { fly } from 'svelte/transition';
	import RemoteSearchInput from "$lib/common/shared/RemoteSearchInput.svelte";

    const limit = 5;

    /**
     * @type {{
     *   states?: {key: string, value: string | null}[],
     *   maxLength?: number,
     *   onSearch?: (e: string) => Promise<string[]>
     * }}
     */
    let {
        states = $bindable([]),
        maxLength = 3000,
        onSearch = () => Promise.resolve([])
    } = $props();

    /** @param {number} idx */
    function removeState(idx) {
        states = states.filter((_, index) => index !== idx);
    }

    function addState() {
        states = [
            ...states,
            { key: '', value: ''}
        ];
    }

    /**
     * @param {number} idx
     * @param {string} key
     */
    function handleKeyChange(idx, key) {
        states = states.map((s, i) => i === idx ? { ...s, key } : s);
    }

    /**
     * @param {number} idx
     * @param {string | null} value
     */
    function handleValueChange(idx, value) {
        states = states.map((s, i) => i === idx ? { ...s, value } : s);
    }
</script>


<div
    class="state-search-container"
    in:fly={{ y: -10, duration: 500 }}
    out:fly={{ y: -10, duration: 200 }}
>
    {#each states as state, idx (idx)}
        <div class="state-search-item">
            <div class="state-search-field">
                <RemoteSearchInput
                    value={state.key}
                    maxLength={maxLength}
                    onSearch={e => onSearch(e)}
                    placeholder="Search states..."
                    onValueChange={(/** @type {string} */ val) => handleKeyChange(idx, val)}
                />
            </div>
            <div class="state-search-field">
                <input
                    type="text"
                    class="state-search-value"
                    value={state.value ?? ''}
                    maxlength={maxLength}
                    disabled={!state.key}
                    placeholder="Enter a value"
                    oninput={(e) => handleValueChange(idx, /** @type {HTMLInputElement} */ (e.target).value)}
                />
            </div>
            <button
                type="button"
                class="state-search-remove"
                class:hide={states.length === 1}
                disabled={states.length === 1}
                aria-label="Remove state filter"
                title="Remove"
                onclick={() => removeState(idx)}
            >
                <i class="bx bxs-no-entry"></i>
            </button>
        </div>
    {/each}
    {#if states.length < limit}
        <div class="state-search-actions">
            <button
                type="button"
                class="state-search-add"
                onclick={() => addState()}
            >
                <i class="mdi mdi-plus"></i>
                Add
            </button>
            <div class="state-search-actions-spacer"></div>
        </div>
    {/if}
</div>

<style>
    /* ============================================================
       StateSearch — self-contained baseline styling.
       Page-level :global() overrides (e.g. .conv-state-search,
       .instruct-state-search) still win where present via their
       higher-specificity ancestor selectors.
       ============================================================ */

    .state-search-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .state-search-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .state-search-field {
        flex: 1 1 0;
        min-width: 0;
    }

    /* Value input (the right-hand input). Overrides Bootstrap form-control
       to match the height/radius/focus ring used across the migrated UI. */
    .state-search-value {
        width: 100%;
        height: 2.5rem;
        padding: 0 0.75rem;
        margin: 0;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        background-color: rgb(255 255 255);
        font-size: 0.875rem;
        line-height: 1.5;
        color: rgb(31 41 55);
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
    }
    .state-search-value::placeholder {
        color: var(--color-muted);
        opacity: 1;
    }
    .state-search-value:focus {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 1px var(--color-primary);
    }
    .state-search-value:disabled {
        background-color: rgb(249 250 251);
        color: var(--color-muted);
        cursor: not-allowed;
        opacity: 0.7;
    }

    /* Remove button — soft danger pill matching the pattern used in the
       state/coding KV rows on the instruction testing page. */
    .state-search-remove {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.75rem;
        height: 1.75rem;
        padding: 0;
        margin: 0;
        border: 0;
        border-radius: 0.375rem;
        background-color: color-mix(in srgb, var(--color-danger) 15%, transparent);
        color: var(--color-danger);
        font-size: 1rem;
        line-height: 1;
        cursor: pointer;
        transition: transform 0.15s ease, background-color 0.15s ease;
    }
    .state-search-remove:hover:not(:disabled) {
        transform: scale(1.08);
        background-color: color-mix(in srgb, var(--color-danger) 25%, transparent);
    }
    .state-search-remove:focus-visible {
        outline: 2px solid var(--color-danger);
        outline-offset: 2px;
    }
    /* When only one state remains the remove button is hidden but its
       footprint is preserved so the row stays aligned. */
    .state-search-remove.hide {
        visibility: hidden;
        pointer-events: none;
    }
    .state-search-remove :global(i) {
        line-height: 1;
    }

    /* Action row (the "Add" link) */
    .state-search-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.125rem;
    }
    .state-search-actions-spacer {
        flex: 0 0 1.75rem;
    }
    .state-search-add {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.625rem;
        border: 0;
        background: transparent;
        color: var(--color-primary);
        font-weight: 500;
        font-size: 0.8125rem;
        line-height: 1.4;
        text-decoration: none;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
    }
    .state-search-add:hover {
        background-color: var(--color-primary);
        color: rgb(255 255 255);
    }
    .state-search-add:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    .state-search-add :global(i) {
        font-size: 1rem;
        line-height: 1;
    }
</style>

