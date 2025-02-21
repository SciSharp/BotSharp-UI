<script>
    import { fly } from 'svelte/transition';
	import RemoteSearchInput from "$lib/common/RemoteSearchInput.svelte";
	import { Button, Input } from "@sveltestrap/sveltestrap";

    const limit = 5;

    /** @type {{key: string, value: string | null}[]} */
    export let states = [];

    /** @type {number} */
    export let maxLength = 3000;

    /** @type {(e: string) => Promise<string[]>} */
	export let onSearch = e => Promise.resolve([]);


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
</script>


<div
    class="state-search-container"
    in:fly={{ y: -10, duration: 500 }}
    out:fly={{ y: -10, duration: 200 }}
>
    {#each states as state, idx}
        <div class="state-search-item">
            <div>
                <RemoteSearchInput
                    bind:value={state.key}
                    maxLength={maxLength}
                    onSearch={e => onSearch(e)}
                    placeholder="Search States"
                />
            </div>
            <div>
                <Input
                    type="text"
                    bind:value={state.value}
                    maxlength={maxLength}
                    disabled={!state.key}
                    placeholder="Enter a value"
                />
            </div>
            <div class="line-align-center" style="flex: 0 0 13px;">
                <div>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <i
                        class="bx bx-no-entry text-danger clickable"
                        class:hide={idx === 0}
                        on:click={() => removeState(idx)}
                    />
                </div>
            </div>
        </div>
    {/each}
    {#if states.length < limit}
    <div>
        <Button 
            color="link"
            style="padding-left: 0px;"
            on:click={() => addState()}
        >
            Add +
        </Button>
    </div>
    {/if}
</div>

