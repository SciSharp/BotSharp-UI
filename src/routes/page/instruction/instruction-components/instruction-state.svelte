<script>
	import { Button, Input } from '@sveltestrap/sveltestrap';

    const maxLength = 3000;
    const limit = 8;

    /** @type {{key: string, value: string | null}[]} */
    export let states = [];

    /** @type {boolean} */
    export let disabled = false;


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
    }
</script>


<div class="instruct-setting-section instruct-setting-padding">
    <div class="instruct-state-container">
        {#each states as state, idx}
            <div class="instruct-state-item">
                <div>
                    {#if idx === 0}
                    <div class="text-primary mb-1">
                        {'Key'}
                    </div>
                    {/if}
                    <Input
                        type="text"
                        bind:value={state.key}
                        maxlength={maxLength}
                        disabled={disabled}
                        placeholder="Enter a state"
                    />
                </div>
                <div>
                    {#if idx === 0}
                    <div class="text-primary mb-1">
                        {'Value'}
                    </div>
                    {/if}
                    <Input
                        type="text"
                        bind:value={state.value}
                        maxlength={maxLength}
                        disabled={disabled}
                        placeholder="Enter a value"
                    />
                </div>
                <div class="line-align-center" style={`flex: 0 0 13px; margin-top: ${idx === 0 ? '23px' : '0px'}`}>
                    <div>
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <i
                            class="bx bx-no-entry text-danger clickable"
                            on:click={() => removeState(idx)}
                        />
                    </div>
                </div>
            </div>
        {/each}
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
    </div>
</div>`