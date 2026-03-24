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
        onSearch = (/** @type {string} */ e) => Promise.resolve([])
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
</script>


<div
    class="state-search-container"
    in:fly={{ y: -10, duration: 500 }}
    out:fly={{ y: -10, duration: 200 }}
>
    {#each states as state, idx}
        <div class="state-search-item">
            <div style="flex: 1;">
                <RemoteSearchInput
                    bind:value={state.key}
                    maxLength={maxLength}
                    onSearch={e => onSearch(e)}
                    placeholder="Search States"
                />
            </div>
            <div style="flex: 1;">
                <input
                    type="text"
                    class="form-control"
                    bind:value={state.value}
                    maxlength={maxLength}
                    disabled={!state.key}
                    placeholder="Enter a value"
                />
            </div>
            <div class="line-align-center" style="flex: 0 0 13px;">
                <div>
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <i
                        class="bx bxs-no-entry text-danger clickable"
                        class:hide={states.length === 1}
                        onclick={() => removeState(idx)}
                    ></i>
                </div>
            </div>
        </div>
    {/each}
    {#if states.length < limit}
        <div class="d-flex justify-content-end">
            <button
                type="button"
                class="btn btn-link"
                style="padding-left: 0px;"
                onclick={() => addState()}
            >
                Add +
            </button>
            <div style="flex: 0 0 13px;"></div>
        </div>
    {/if}
</div>

