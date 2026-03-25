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


<div class="instruct-setting-section instruct-setting-padding">
    <div class="instruct-kv-container" bind:this={scrollContainer}>
        {#each states as state, idx}
            <div class="instruct-kv-item">
                <div style="flex: 0.45;">
                    {#if idx === 0}
                    <div class="text-primary mb-1">
                        {'Key'}
                    </div>
                    {/if}
                    <input
                        type="text"
                        class="form-control"
                        name={`state-key-${idx}`}
                        bind:value={state.key}
                        maxlength={maxLength}
                        disabled={disabled}
                        placeholder="Enter a name"
                    />
                </div>
                <div style="flex: 0.45;">
                    {#if idx === 0}
                    <div class="text-primary mb-1">
                        {'Value'}
                    </div>
                    {/if}
                    <input
                        type="text"
                        class="form-control"
                        name={`state-value-${idx}`}
                        bind:value={state.value}
                        maxlength={maxLength}
                        disabled={disabled}
                        placeholder="Enter a value"
                    />
                </div>
                <div class="line-align-center" style={`flex: 0 0 13px; margin-top: ${idx === 0 ? '23px' : '3px'}`}>
                    <div>
                        <i
                            class="bx bxs-no-entry text-danger clickable"
                            role="button"
                            tabindex="0"
                            onclick={() => removeState(idx)}
                            onkeydown={(/** @type {KeyboardEvent} */ e) => { if (e.key === 'Enter') removeState(idx); }}
                        ></i>
                    </div>
                </div>
            </div>
        {/each}
    </div>
    {#if states.length < limit}
        <div class="text-center">
            <button
                type="button"
                class="btn btn-link"
                style="padding-left: 0px;"
                disabled={disabled}
                onclick={() => addState()}
            >
                Add +
            </button>
        </div>
    {/if}
</div>