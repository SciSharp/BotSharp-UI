<script>
    import { fade } from 'svelte/transition';
    import { untrack } from 'svelte';
    import _ from "lodash";

    let {
        isOpen = false,
        size = 'xl',
        className = '',
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

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl'
    };

    /** @type {import('$conversationTypes').UserStateDetailModel} */
    const defaultState = {
        key: { data: '', isValid: true },
        value: { data: '', isValid: true },
        active_rounds: { data: -1, isValid: true }
    };

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

{#if isOpen}
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    class="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50"
    transition:fade={{ duration: 150 }}
    onclick={handleBackdropClick}
>
    <div class={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size] || 'max-w-xl'} mx-4 ${className}`}>
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="font-semibold text-lg">{title}</div>
        </div>

        <!-- Body -->
        <div class="p-3">
            <form class="state-form">
                {#each states as state, idx (idx)}
                <div class="flex w-full gap-2">
                    <div class="min-w-0" style="flex: 0.4;">
                        <div class="mb-2">
                            {#if idx === 0}
                            <label for="key">
                                {`Key ${validateKey ? '(*)' : ''}`}
                            </label>
                            {/if}
                            <input
                                class={`form-control ${!state.key.isValid ? 'invalid' : ''}`}
                                placeholder="Enter a key"
                                value={state.key.data}
                                maxlength={50}
                                oninput={(e) => changeKey(e, idx)}
                            />
                        </div>
                    </div>
                    <div class="min-w-0" style="flex: 0.4;">
                        <div class="mb-2">
                            {#if idx === 0}
                            <label for="value">
                                {`Value ${validateValue ? '(*)' : ''}`}
                            </label>
                            {/if}
                            <input
                                class={`form-control ${!state.value.isValid ? 'invalid' : ''}`}
                                placeholder="Enter a value"
                                value={state.value.data}
                                maxlength={1000}
                                oninput={(e) => changeValue(e, idx)}
                            />
                        </div>
                    </div>
                    {#if requireActiveRounds}
                    <div class="flex-1 min-w-0 state-num-input">
                        <div class="mb-2">
                            {#if idx === 0}
                            <label for="value">
                                {`Active rounds`}
                            </label>
                            {/if}
                            <input
                                type="number"
                                class="form-control"
                                placeholder="Enter a value"
                                value={state.active_rounds.data}
                                oninput={(e) => changeActiveRounds(e, idx)}
                            />
                        </div>
                    </div>
                    {/if}
                    <div class="state-delete mb-2 flex items-end flex-shrink-0">
                        <div class="flex items-center" style={`height: 36px; ${idx === 0 ? 'margin-top: auto;' : ''}`}>
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <i
                                class="bx bxs-no-entry clickable"
                                class:hide={states.length === 1}
                                onclick={() => remove(idx)}
                            ></i>
                        </div>
                    </div>
                </div>
                {/each}
                <div class="flex flex-wrap">
                    <div>
                        <button
                            type="button"
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={states.length >= limit}
                            onclick={() => addState()}
                        >
                            Add +
                        </button>
                    </div>
                </div>
            </form>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
            <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                onclick={(e) => handleConfirm(e)}
            >
                Confirm
            </button>
            <button
                type="button"
                class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                onclick={(e) => handleCancel(e)}
            >
                Cancel
            </button>
        </div>
    </div>
</div>
{/if}