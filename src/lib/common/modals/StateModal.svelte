<script>
    import { fade, slide } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { untrack } from 'svelte';
    import _ from "lodash";
    import { scrollToBottom } from '$lib/helpers/utils/common';

    let {
        isOpen = false,
        size = 'xl',
        className = '',
        inline = false,
        toggleModal = () => {},
        confirm = () => {},
        cancel = () => {},
        limit = 10,
        title = "Add states",
        validateKey = true,
        validateValue = true,
        requireActiveRounds = false,
        states = $bindable([])
    } = $props();

    /** @type {Record<string, string>} */
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl'
    };

    /** @type {import('$conversationTypes').UserStateDetailModel} */
    const defaultState = {
        key: { data: '', isValid: true },
        value: { data: '', isValid: true },
        active_rounds: { data: -1, isValid: true }
    };

    /** @type {HTMLDivElement | undefined} */
    let bodyEl = $state();

    $effect(() => {
        if (isOpen) {
            untrack(() => {
                if (states?.length > 0) {
                    states = [...states];
                } else {
                    states = [{...JSON.parse(JSON.stringify(defaultState))}];
                }
            });
        }
    });

    /** @param {MouseEvent} e */
    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            toggleModal();
        }
    }

    /** @param {any} e */
    function handleConfirm(e) {
        e.preventDefault();

        // form validation
        let isValidForm = true;
        states = states.map(state => {
            const key = _.trim(state.key.data);
            const value = _.trim(state.value.data);
            if (!key && validateKey) {
                state.key.isValid = false;
                isValidForm = isValidForm && state.key.isValid;
            }

            if (!value && validateValue) {
                state.value.isValid = false;
                isValidForm = isValidForm && state.value.isValid;
            }
            return state;
        });

        if (!isValidForm) return;
        confirm && confirm();
    }

    /** @param {any} e */
    function handleCancel(e) {
        e.preventDefault();
        cancel && cancel();
    }

    function addState() {
        states = [...states, {...JSON.parse(JSON.stringify(defaultState))}];
        scrollToBottom(bodyEl);
    }

    /** @param {number} index */
    function remove(index) {
        states = states.filter((x, idx) => idx !== index);
    }

    /**
     * @param {any} e
     * @param {number} index
    */
    function changeKey(e, index) {
        states = states.map((state, idx) => {
            if (idx === index) {
                state.key.isValid = true;
                state.key.data = e.target.value;
            }
            return state;
        });
    }

    /**
     * @param {any} e
     * @param {number} index
    */
    function changeValue(e, index) {
        states = states.map((state, idx) => {
            if (idx === index) {
                state.value.isValid = true;
                state.value.data = e.target.value;
            }
            return state;
        });
    }

    /**
     * @param {any} e
     * @param {number} index
    */
    function changeActiveRounds(e, index) {
        states = states.map((state, idx) => {
            if (idx === index) {
                state.active_rounds.isValid = true;
                state.active_rounds.data = validateActiveRounds(Number(e.target.value) || 0);
            }
            return state;
        });
    }

    /** @param {number} rounds */
    function validateActiveRounds(rounds) {
        let res = rounds;
        const lowerLimit = -1;
        const upperLimit = 9999;

        if (rounds < lowerLimit) {
            res = lowerLimit;
        } else if (rounds > upperLimit) {
            res = upperLimit;
        }
        return res;
    }
</script>

{#snippet addButton()}
    <button
        type="button"
        class="stm-add-btn"
        disabled={states.length >= limit}
        onclick={() => addState()}
    >
        <i class="mdi mdi-plus text-base leading-none"></i>
        <span>Add</span>
    </button>
{/snippet}

{#snippet actionButtons()}
    <button
        type="button"
        class="stm-btn stm-btn-confirm"
        onclick={(e) => handleConfirm(e)}
    >
        Confirm
    </button>
    <button
        type="button"
        class="stm-btn stm-btn-cancel"
        onclick={(e) => handleCancel(e)}
    >
        Cancel
    </button>
{/snippet}

{#snippet panelInner()}
    <!-- Branded accent strip across the top edge of the panel / inline section. -->
    <div class="stm-accent"></div>

    <!-- Header (the `stm-header` class is a layout hook used by .stm-inline
         to pin this row at the top of the flex-column section so it doesn't
         shrink when many rows are added). -->
    <div class="stm-header flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2 min-w-0">
            <span class="stm-title-glyph">
                <i class="bx bx-cube-alt"></i>
            </span>
            <span class="truncate text-[1.0625rem] font-semibold text-gray-900 dark:text-gray-100">{title}</span>
        </div>
        <span class="stm-count" aria-label={`${states.length} of ${limit}`}>
            <span class="font-semibold">{states.length}</span><span class="opacity-50">/{limit}</span>
        </span>
    </div>

    <!-- Body -->
    <div class="stm-body px-5 py-4" bind:this={bodyEl}>
        <form>
            <div class="stm-rows flex flex-col gap-2.5">
            {#each states as state, idx (idx)}
            <div class="flex w-full items-end gap-2">
                <div class="min-w-0" style="flex: 0.4;">
                    {#if idx === 0}
                    <label for={`stm-key-${idx}`} class="stm-label">
                        {`Name ${validateKey ? '*' : ''}`}
                    </label>
                    {/if}
                    <input
                        id={`stm-key-${idx}`}
                        class={`stm-input ${!state.key.isValid ? 'stm-input-invalid' : ''}`}
                        placeholder="Enter a key"
                        value={state.key.data}
                        maxlength={50}
                        oninput={(e) => changeKey(e, idx)}
                    />
                </div>
                <div class="min-w-0" style="flex: 0.4;">
                    {#if idx === 0}
                    <label for={`stm-value-${idx}`} class="stm-label">
                        {`Value ${validateValue ? '*' : ''}`}
                    </label>
                    {/if}
                    <input
                        id={`stm-value-${idx}`}
                        class={`stm-input ${!state.value.isValid ? 'stm-input-invalid' : ''}`}
                        placeholder="Enter a value"
                        value={state.value.data}
                        maxlength={1000}
                        oninput={(e) => changeValue(e, idx)}
                    />
                </div>
                {#if requireActiveRounds}
                <div class="min-w-0" style="flex: 0.2;">
                    {#if idx === 0}
                    <label for={`stm-rounds-${idx}`} class="stm-label">
                        {`Active rounds`}
                    </label>
                    {/if}
                    <input
                        id={`stm-rounds-${idx}`}
                        type="number"
                        class="stm-input stm-input-number"
                        placeholder="Enter a value"
                        value={state.active_rounds.data}
                        oninput={(e) => changeActiveRounds(e, idx)}
                    />
                </div>
                {/if}
                <div class="flex-shrink-0">
                    <button
                        type="button"
                        class="stm-remove-btn"
                        class:invisible={states.length === 1}
                        aria-label="Remove state"
                        title="Remove"
                        onclick={() => remove(idx)}
                    >
                        <i class="bx bxs-no-entry"></i>
                    </button>
                </div>
            </div>
            {/each}
            </div>

        </form>
    </div>

    <!-- Footer: Add on the left, Confirm + Cancel grouped on the right,
         identical in both modal and inline modes. -->
    <div class="stm-footer flex items-center justify-between gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-700">
        {@render addButton()}
        <div class="flex items-center gap-2">
            {@render actionButtons()}
        </div>
    </div>
{/snippet}


{#if isOpen && inline}
    <section
        class={`stm-inline ${className}`}
        aria-label={title}
        transition:slide={{ duration: 220, easing: cubicOut }}
    >
        {@render panelInner()}
    </section>
{:else if isOpen}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
        class="stm-overlay"
        transition:fade={{ duration: 150 }}
        onclick={handleBackdropClick}
    >
        <div
            class={`stm-panel relative mx-4 w-full ${sizeClasses[size] || 'max-w-xl'} ${className}`}
            role="dialog"
            aria-modal="true"
        >
            {@render panelInner()}
        </div>
    </div>
{/if}

<style>
    /* ============================================================
       StateModal — themed via Tailwind v4 design tokens; no Bootstrap.
       Layout / spacing live in inline utility classes; this block owns
       the polish (backdrop blur, accent strip, focus rings, dual-shadow,
       error shake, dark mode).
       ============================================================ */

    /* ---------- Overlay ---------- */
    .stm-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 3rem 1rem 1rem;
        background-color: rgb(15 23 42 / 0.55);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        overflow-y: auto;
    }

    /* ---------- Panel ---------- */
    .stm-panel {
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.875rem;
        box-shadow:
            0 25px 50px -12px rgb(15 23 42 / 0.25),
            0 12px 24px -8px color-mix(in srgb, var(--color-primary) 18%, transparent),
            0 0 0 1px rgb(255 255 255 / 0.06) inset;
        overflow: hidden;
        animation: stm-rise 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    @keyframes stm-rise {
        from { opacity: 0; transform: translateY(-12px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0)     scale(1);    }
    }

    /* ---------- Inline variant ---------- */
    .stm-inline {
        display: flex;
        flex-direction: column;
        background-color: rgb(255 255 255);
        border-bottom: 1px solid rgb(229 231 235);
    }

    /* Pinned children — accent strip, header bar, footer (Confirm/Cancel)
       — never shrink so the flex body absorbs the spare/overflow space. */
    .stm-inline :global(.stm-accent),
    .stm-inline :global(.stm-header),
    .stm-inline :global(.stm-footer) {
        flex-shrink: 0;
    }

    .stm-inline :global(.stm-body) {
        flex: 1 1 auto;
    }


    .stm-accent {
        height: 3px;
        background: linear-gradient(
            90deg,
            var(--color-primary) 0%,
            color-mix(in srgb, var(--color-primary) 60%, white) 50%,
            var(--color-primary) 100%
        );
    }

    /* ---------- Header glyph + count badge ---------- */
    .stm-title-glyph {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 0.5rem;
        background: color-mix(in srgb, var(--color-primary) 12%, transparent);
        color: var(--color-primary);
        font-size: 1rem;
        flex-shrink: 0;
    }
    .stm-count {
        display: inline-flex;
        align-items: center;
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
        color: var(--color-primary);
        font-size: 0.75rem;
        line-height: 1.4;
        flex-shrink: 0;
        font-variant-numeric: tabular-nums;
    }

    .stm-body {
        height: 25vh;
        overflow-y: auto;
        scrollbar-width: thin;
        margin-right: -0.375rem;
    }
    .stm-body::-webkit-scrollbar {
        width: 8px;
    }
    .stm-body::-webkit-scrollbar-thumb {
        background-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
        border-radius: 999px;
    }
    .stm-body::-webkit-scrollbar-thumb:hover {
        background-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
    }

    .stm-label {
        display: block;
        margin-bottom: 0.375rem;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--color-primary);
    }

    /* ---------- Inputs (replaces Bootstrap .form-control + .invalid) ---------- */
    .stm-input {
        width: 100%;
        height: 2.25rem;
        padding: 0 0.75rem;
        font-size: 0.875rem;
        line-height: 1.5;
        color: rgb(17 24 39);
        background-color: rgb(255 255 255);
        border: 1px solid rgb(209 213 219);
        border-radius: 0.5rem;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
    }
    .stm-input::placeholder { color: rgb(156 163 175); }
    .stm-input:hover:not(:disabled):not(:focus) { border-color: rgb(156 163 175); }
    .stm-input:focus {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 22%, transparent);
    }
    .stm-input-invalid {
        border-color: var(--color-danger);
        background-color: color-mix(in srgb, var(--color-danger) 5%, white);
        animation: stm-shake 250ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    .stm-input-invalid:focus {
        border-color: var(--color-danger);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-danger) 22%, transparent);
    }
    @keyframes stm-shake {
        10%, 90% { transform: translateX(-1px); }
        20%, 80% { transform: translateX(2px); }
        30%, 50%, 70% { transform: translateX(-3px); }
        40%, 60% { transform: translateX(3px); }
    }

    /* Slimmer chrome on number input spinner arrows (Chromium + Firefox) */
    .stm-input-number {
        appearance: textfield;
        -moz-appearance: textfield;
    }
    .stm-input-number::-webkit-inner-spin-button,
    .stm-input-number::-webkit-outer-spin-button {
        opacity: 0.6;
        height: 1.5rem;
    }

    /* ---------- Row remove button (replaces .state-delete + .bx.clickable) ---------- */
    .stm-remove-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.25rem;
        height: 2.25rem;
        margin: 0;
        padding: 0;
        border: 1px solid color-mix(in srgb, var(--color-danger) 25%, transparent);
        border-radius: 0.5rem;
        background-color: color-mix(in srgb, var(--color-danger) 10%, transparent);
        color: var(--color-danger);
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
    }
    .stm-remove-btn:hover {
        background-color: color-mix(in srgb, var(--color-danger) 18%, transparent);
        border-color: color-mix(in srgb, var(--color-danger) 50%, transparent);
        transform: scale(1.05);
    }
    .stm-remove-btn:focus-visible {
        outline: 2px solid var(--color-danger);
        outline-offset: 2px;
    }

    /* ---------- Add row button ----------
       Lives in the footer next to .stm-btn (Confirm/Cancel) in both
       modal and inline modes, so its height matches .stm-btn's 2.25rem
       to keep the action bar visually aligned. */
    .stm-add-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        height: 2.25rem;
        padding: 0 0.875rem;
        border: 1px dashed color-mix(in srgb, var(--color-primary) 45%, transparent);
        border-radius: 999px;
        background-color: transparent;
        color: var(--color-primary);
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }
    .stm-add-btn:hover:not(:disabled) {
        background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
        border-color: var(--color-primary);
    }
    .stm-add-btn:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }
    .stm-add-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }

    /* ---------- Footer + buttons ---------- */
    .stm-footer {
        background-color: rgb(249 250 251);
    }

    .stm-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 5.5rem;
        height: 2.25rem;
        padding: 0 1rem;
        border-radius: 0.5rem;
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease,
            box-shadow 0.15s ease, transform 0.1s ease;
    }
    .stm-btn:active:not(:disabled) { transform: translateY(1px); }
    .stm-btn:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }
    .stm-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .stm-btn-cancel {
        border: 1px solid rgb(229 231 235);
        background-color: rgb(255 255 255);
        color: rgb(55 65 81);
    }
    .stm-btn-cancel:hover:not(:disabled) {
        background-color: rgb(243 244 246);
        border-color: rgb(209 213 219);
        color: rgb(17 24 39);
    }

    .stm-btn-confirm {
        border: 1px solid var(--color-primary);
        background-color: var(--color-primary);
        color: rgb(255 255 255);
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.08),
            0 4px 12px -4px color-mix(in srgb, var(--color-primary) 50%, transparent);
    }
    .stm-btn-confirm:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.12),
            0 8px 20px -4px color-mix(in srgb, var(--color-primary) 55%, transparent);
    }

    /* ---------- Dark mode ---------- */
    :global(.dark) .stm-overlay { background-color: rgb(0 0 0 / 0.65); }
    :global(.dark) .stm-panel {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .stm-inline {
        background-color: rgb(31 41 55);
        border-bottom-color: rgb(55 65 81);
    }
    :global(.dark) .stm-input {
        background-color: rgb(17 24 39);
        border-color: rgb(75 85 99);
        color: rgb(229 231 235);
    }
    :global(.dark) .stm-input::placeholder { color: rgb(107 114 128); }
    :global(.dark) .stm-input:hover:not(:disabled):not(:focus) { border-color: rgb(107 114 128); }
    :global(.dark) .stm-footer {
        background-color: rgb(17 24 39);
    }
    :global(.dark) .stm-btn-cancel {
        background-color: rgb(55 65 81);
        border-color: rgb(75 85 99);
        color: rgb(229 231 235);
    }
    :global(.dark) .stm-btn-cancel:hover:not(:disabled) {
        background-color: rgb(75 85 99);
        border-color: rgb(107 114 128);
    }
</style>
