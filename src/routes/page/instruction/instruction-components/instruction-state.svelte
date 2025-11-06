<script>
    import { Button, Input } from '@sveltestrap/sveltestrap';
	import { scrollToBottom } from '$lib/helpers/utils/common';

    const maxLength = 4096;
    const limit = 10;

    /** @type {import('$commonTypes').KeyValuePair[]} */
    export let states = [];

    /** @type {boolean} */
    export let disabled = false;

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
                <div style="flex: 0.4;">
                    {#if idx === 0}
                    <div class="text-primary mb-1">
                        {'Key'}
                    </div>
                    {/if}
                    <Input
                        type="text"
                        name={`state-key-${idx}`}
                        bind:value={state.key}
                        maxlength={maxLength}
                        disabled={disabled}
                        placeholder="Enter a name"
                    />
                </div>
                <div style="flex: 0.4;">
                    {#if idx === 0}
                    <div class="text-primary mb-1">
                        {'Value'}
                    </div>
                    {/if}
                    <Input
                        type="text"
                        name={`state-value-${idx}`}
                        bind:value={state.value}
                        maxlength={maxLength}
                        disabled={disabled}
                        placeholder="Enter a value"
                    />
                </div>
                <div class="line-align-center" style={`flex: 0 0 13px; margin-top: ${idx === 0 ? '23px' : '3px'}`}>
                    <div>
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <i
                            class="bx bxs-no-entry text-danger clickable"
                            on:click={() => removeState(idx)}
                        />
                    </div>
                </div>
            </div>
        {/each}
    </div>
    {#if states.length < limit}
        <div class="text-center">
            <Button 
                color="link"
                style="padding-left: 0px;"
                disabled={disabled}
                on:click={() => addState()}
            >
                Add +
            </Button>
        </div>
    {/if}
</div>`