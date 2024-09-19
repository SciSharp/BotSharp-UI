<script>
    import { onMount, onDestroy } from 'svelte';
    import { fly } from 'svelte/transition';
    import { Input, Tooltip } from '@sveltestrap/sveltestrap';
    import util from "lodash";
    

    const maxLength = 50;

    /** @type {{ key: string, displayName: string }[]} */
    export let items;
    
    /** @type {boolean} */
    export let disabled = false;


    /** @type {boolean} */
    let showAdvSearch = false;

    /** @type {any[]} */
    let innerItems = [];


    onMount(() => {
        init();
    });

    onDestroy(() => {
        reset();
    });

    function init() {
        showAdvSearch = false;
        reset();
    }


    /** @param {any} e */
    function toggleAdvSearch(e) {
        showAdvSearch = e.target.checked;
        if (!showAdvSearch) {
            reset();
        }
    }

    function reset() {
        innerItems = items?.map(x => {
            return {
                key: x.key,
                checked: false,
                displayName: x.displayName,
                value: ''
            };
        }) || [];
    }

    
    /**
	 * @param {number} idx
     * @param {any} e
	 */
    function toggleItemCheckbox(idx, e) {
        const found = innerItems.find((_, index) => index === idx);
        if (found) {
            found.checked = e.target.checked;
            innerItems = innerItems.map((x, index) => {
                return index === idx ? { ...found } : x;
            });
        }
    }

    /**
	 * @param {number} idx
     * @param {any} e
	 */
    function changeItemValue(idx, e) {
        const found = innerItems.find((_, index) => index === idx);
        if (found) {
            found.value = e.target.value;
            innerItems = innerItems.map((x, index) => {
                return index === idx ? { ...found } : x;
            });
        }
    }
</script>


<div
    class="knowledge-adv-search-container"
    in:fly={{ y: -10, duration: 500 }}
    out:fly={{ y: -10, duration: 200 }}
>
    <div class="knowledge-adv-search-btn text-primary fw-bold">
        <Input
            type="switch"
            disabled={disabled}
            checked={showAdvSearch}
            on:change={e => toggleAdvSearch(e)}
        />
        <div class="line-align-center">
            <div>{'Advance Search'}</div>
        </div>
        {#if showAdvSearch}
            <div class="line-align-center" id="adv-search-tooltip">
                <i class="bx bx-info-circle" />
            </div>
            <Tooltip target="adv-search-tooltip" placement="top" class="demo-tooltip-note">
                <ul>
                    <li>{'Select the checkbox to enable seaching in each field.'}</li>
                    <li>{'Empty value will not be used to search.'}</li>
                </ul>
            </Tooltip>
        {/if}
    </div>

    {#if showAdvSearch}
        <div
            class={'knowledge-adv-search-items'}
            in:fly={{ y: -10, duration: 500 }}
            out:fly={{ y: -10, duration: 200 }}
        >
            {#each innerItems as item, idx (idx)}
                <div class="knowledge-adv-search-item">
                    <div class="search-item-cb line-align-center">
                        <Input
                            type="checkbox"
                            disabled={disabled}
                            checked={item.checked}
                            on:change={e => toggleItemCheckbox(idx, e)}
                        />
                    </div>
                    <div class="search-item-name fw-bold line-align-center">
                        <div>{`${item.displayName}:`}</div>
                    </div>
                    <div class="search-item-content line-align-center">
                        <Input
                            type="text"
                            disabled={!item.checked || disabled}
                            maxlength={maxLength}
                            value={item.value}
                            on:input={e => changeItemValue(idx, e)}
                        />
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
