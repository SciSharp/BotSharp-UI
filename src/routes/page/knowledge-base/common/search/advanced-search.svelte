<script>
    import { onMount, onDestroy, tick } from 'svelte';
    import { fly } from 'svelte/transition';
    import { Input, Tooltip, Button } from '@sveltestrap/sveltestrap';
    import { v4 as uuidv4 } from 'uuid';
    
    /** @type {boolean} */
    export let showAdvSearch = false;

    /** @type {{ uuid: string, key: string, value: string, checked: boolean }[]} */
    export let items = [];

    /** @type {string} */
    export let operator = 'or';

    /** @type {number} */
    export let maxLength = 1000;

    /** @type {number} */
    export let limit = 10;

    /** @type {boolean} */
    export let disabled = false;

    const logicalOperators = [
        {
            id: 'operator-and',
            value: 'and',
            label: 'AND',
            tip: 'All of the conditions should match.'
        },
        {   
            id: 'operator-or',
            value: 'or',
            label: 'OR',
            tip: 'At least one of the conditions should match.'
        }
    ];

    /** @type {HTMLElement} */
    let scrollContainer;

    onMount(() => {});

    onDestroy(() => {
        reset();
    });


    /** @param {any} e */
    function toggleAdvSearch(e) {
        showAdvSearch = e.target.checked;
    }

    function reset() {
        items = [{ uuid: uuidv4(), key: '', value: '', checked: true }];
    }

    
    /**
     * @param {any} e
     * @param {number} idx
	 */
    function toggleItem(e, idx) {
        const found = items.find((_, index) => index === idx);
        if (found) {
            found.checked = e.target.checked;
            items = items.map((x, index) => {
                return index === idx ? { ...found } : x;
            });
        }
    }

    async function addItem() {
        items = [
            ...items,
            { uuid: uuidv4(), key: '', value: '', checked: true }
        ];

        // Wait for DOM to update, then scroll to bottom
        await tick();
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }

    /**
     * @param {number} idx
	 */
    function removeItem(idx) {
        if (disabled) return;

        items = items.filter((_, index) => idx !== index);
    }

    /**
     * @param {any} e
	 * @param {number} idx
     * @param {string} key
	 */
    function changeItem(e, idx, key) {
        const found = items.find((_, index) => index === idx);
        if (found) {
            if (key === 'key') {
                found.key = e.target.value;
            } else if (key === 'value') {
                found.value = e.target.value;
            }
            items = items.map((x, index) => {
                return index === idx ? { ...found } : x;
            });
        }
    }

    /**
     * @param {any} e
     */
    function changeLogicalOperator(e) {
        operator = e.target.value;
    }
</script>


<div
    class="knowledge-adv-search-container mt-5"
    in:fly={{ y: -10, duration: 500 }}
    out:fly={{ y: -10, duration: 200 }}
>
    <div class="knowledge-adv-search-btn text-primary fw-bold">
        <div class="line-align-center">
            <Input
                type="switch"
                disabled={disabled}
                checked={showAdvSearch}
                on:change={e => toggleAdvSearch(e)}
            />
        </div>
        <div class="line-align-center">
            <div>{'Advanced Filters'}</div>
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
            bind:this={scrollContainer}
            in:fly={{ y: -10, duration: 500 }}
            out:fly={{ y: -10, duration: 200 }}
        >
            <div class="knowledge-adv-search-item">
                <div class="search-item-cb line-align-center">
                    <div class="fw-bold">{''}</div>
                </div>
                <div class="search-item-content line-align-center">
                    <div class="fw-bold">{'Name'}</div>
                </div>
                <div class="search-item-content line-align-center">
                    <div class="fw-bold">{'Value'}</div>
                </div>
            </div>
            {#each items as item, idx (item.uuid)}
                <div class="knowledge-adv-search-item">
                    <div class="search-item-cb line-align-center">
                        <Input
                            type="checkbox"
                            disabled={disabled}
                            checked={item.checked}
                            on:change={e => toggleItem(e, idx)}
                        />
                    </div>
                    <div class="search-item-content line-align-center">
                        <Input
                            type="text"
                            disabled={!item.checked || disabled}
                            maxlength={maxLength}
                            value={item.key}
                            on:input={e => changeItem(e, idx, 'key')}
                        />
                    </div>
                    <div class="search-item-content line-align-center">
                        <Input
                            type="text"
                            disabled={!item.checked || disabled}
                            maxlength={maxLength}
                            value={item.value}
                            on:input={e => changeItem(e, idx, 'value')}
                        />
                    </div>
                    <div class="search-item-cb line-align-center" style="flex: 0 0 12px;">
                        <div class="line-align-center">
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <i
                                class="bx bx-no-entry text-danger clickable"
                                class:hide={items.length === 1}
                                on:click={() => removeItem(idx)}
                            />
                        </div>
                    </div>
                </div>
            {/each}
            {#if items.length < limit}
                <div class="knowledge-adv-search-item">
                    <div class="search-item-cb line-align-center">
                        <div class="fw-bold">{''}</div>
                    </div>
                    <div class="search-item-content line-align-center">
                        <div class="fw-bold">{''}</div>
                    </div>
                    <div class="search-item-content line-align-center">
                        <div class="d-flex justify-content-end">
                            <Button
                                color="link"
                                style="width: fit-content"
                                on:click={() => addItem()}
                            >
                                {'Add +'}
                            </Button>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <div class="mt-2">
            <div class="d-flex align-items-center gap-5">
                <span class="fw-bold">Search operator:</span>
                {#each logicalOperators as op, idx (idx)}
                    <div class="d-flex align-items-center gap-1">
                        <Input
                            type="radio"
                            id={op.id}
                            name="searchOperator"
                            value={op.value}
                            disabled={disabled}
                            bind:group={operator}
                            on:change={e => changeLogicalOperator(e)}
                        />
                        <label for={op.id} class="mb-0 d-flex gap-1">
                            <span>{op.label}</span>
                            <span class="line-align-center" id={`tooltip-${op.id}`}>
                                <i class="bx bx-info-circle" />
                            </span>
                            <Tooltip target={`tooltip-${op.id}`} placement="top" class="operator-tooltip">
                                <div>{op.tip}</div>
                            </Tooltip>
                        </label>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
