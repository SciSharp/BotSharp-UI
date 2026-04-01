<script>
    import { onDestroy, tick } from 'svelte';
    import { fly } from 'svelte/transition';
    import { v4 as uuidv4 } from 'uuid';
	import Select from '$lib/common/dropdowns/Select.svelte';
	import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';
	import { VectorPayloadDataType } from '$lib/helpers/enums';

    /**
     * @type {{
     *   showAdvSearch?: boolean,
     *   items?: { uuid: string, key: string, value: string, data_type: string, checked: boolean }[],
     *   operator?: string,
     *   sortOrder?: string,
     *   sortField?: string,
     *   maxLength?: number,
     *   limit?: number,
     *   disabled?: boolean
     * }}
     */
    let {
        showAdvSearch = $bindable(false),
        items = $bindable([]),
        operator = $bindable('or'),
        sortOrder = $bindable('desc'),
        sortField = $bindable(''),
        maxLength = 1000,
        limit = 10,
        disabled = false
    } = $props();

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

    const sortDirections = [
        {
            id: 'sort-asc',
            value: 'asc',
            label: 'ASC',
            tip: 'Ascending sort.'
        },
        {
            id: 'sort-desc',
            value: 'desc',
            label: 'DESC',
            tip: 'Descending sort.'
        }
    ];

    const dataTypeOptions = Object.entries(VectorPayloadDataType).map(([_, v]) => ({
        label: v.name.toLowerCase(),
        value: v.name
    }));

    /** @type {HTMLElement} */
    // eslint-disable-next-line svelte/valid-compile
    let scrollContainer;

    onDestroy(() => {
        reset();
    });


    /** @param {any} e */
    function toggleAdvSearch(e) {
        showAdvSearch = e.target.checked;
    }

    function reset() {
        items = [{ uuid: uuidv4(), key: '', value: '', data_type: '', checked: true }];
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

    /** @param {any} e */
    async function addItem(e) {
        e.preventDefault();

        items = [
            ...items,
            { uuid: uuidv4(), key: '', value: '', data_type: '', checked: true }
        ];

        // Wait for DOM to update, then scroll to bottom
        if (scrollContainer) {
            await tick();
            setTimeout(() => {
                scrollContainer.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }, 0);
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
            } else if (key === 'data_type') {
                // @ts-ignore
                const selectedValues = e?.detail?.selecteds?.map(x => x.value) || [];
                found.data_type = selectedValues[0] || null;
            }

            items = items.map((x, index) => {
                return index === idx ? { ...found } : x;
            });
        }
    }
</script>


<div
    class="knowledge-adv-search-container mt-5"
    in:fly={{ y: -10, duration: 500 }}
    out:fly={{ y: -10, duration: 200 }}
>
    <div class="knowledge-adv-search-btn text-primary fw-bold">
        <div class="form-check form-switch line-align-center">
            <input
                type="checkbox"
                class="form-check-input"
                role="switch"
                disabled={disabled}
                checked={showAdvSearch}
                onchange={e => toggleAdvSearch(e)}
            />
        </div>
        <div class="line-align-center">
            <div>{'Advanced Filters'}</div>
        </div>
        {#if showAdvSearch}
            <div class="line-align-center" id="adv-search-tooltip">
                <i class="bx bx-info-circle"></i>
            </div>
            <BotsharpTooltip target="adv-search-tooltip" placement="top" containerClasses="demo-tooltip-note">
                <ul>
                    <li>{'Select the checkbox to enable seaching in each field.'}</li>
                    <li>{'Empty value will not be used to search.'}</li>
                </ul>
            </BotsharpTooltip>
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
                <div class="search-item-content line-align-center">
                    <div class="fw-bold">{'Data type'}</div>
                </div>
                <div style="flex: 0 0 10px;"></div>
            </div>
            {#each items as item, idx (item.uuid)}
                <div class="knowledge-adv-search-item">
                    <div class="search-item-cb line-align-center">
                        <div class="form-check">
                            <input
                                type="checkbox"
                                class="form-check-input"
                                disabled={disabled}
                                checked={item.checked}
                                onchange={e => toggleItem(e, idx)}
                            />
                        </div>
                    </div>
                    <div class="search-item-content line-align-center" data-label="Name">
                        <input
                            type="text"
                            class="form-control"
                            disabled={!item.checked || disabled}
                            maxlength={maxLength}
                            value={item.key}
                            oninput={e => changeItem(e, idx, 'key')}
                        />
                    </div>
                    <div class="search-item-content line-align-center" data-label="Value">
                        <input
                            type="text"
                            class="form-control"
                            disabled={!item.checked || disabled}
                            maxlength={maxLength}
                            value={item.value}
                            oninput={e => changeItem(e, idx, 'value')}
                        />
                    </div>
                    <div class="search-item-content line-align-center" data-label="Data type">
                        <Select
                            tag={'search-payload-data-type-select'}
                            placeholder={'Select'}
                            disabled={!item.checked || disabled}
                            selectedValues={item.data_type ? [item.data_type] : []}
                            options={dataTypeOptions}
                            onselect={e => changeItem(e, idx, 'data_type')}
                        />
                    </div>
                    <div class="search-item-cb line-align-center" style="flex: 0 0 12px;">
                        <div class="line-align-center">
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <i
                                class="bx bxs-no-entry text-danger clickable"
                                class:hide={items.length === 1}
                                onclick={() => removeItem(idx)}
                            ></i>
                        </div>
                    </div>
                </div>
            {/each}
            {#if items.length < limit}
                <div class="knowledge-adv-search-item add-item-row">
                    <div class="search-item-cb line-align-center">
                        <div class="fw-bold">{''}</div>
                    </div>
                    <div class="search-item-content line-align-center">
                        <div class="fw-bold">{''}</div>
                    </div>
                    <div class="search-item-content line-align-center">
                        <div class="fw-bold">{''}</div>
                    </div>
                    <div class="search-item-content line-align-center">
                        <div class="d-flex justify-content-end">
                            <button
                                class="btn btn-link"
                                style="width: fit-content"
                                onclick={e => addItem(e)}
                            >
                                {'Add +'}
                            </button>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <div class="operator-container">
            <div class="operator-item align-items-center gap-5">
                <div class="fw-bold operator-title">Search operator:</div>
                <div class="d-flex align-items-center gap-5">
                    {#each logicalOperators as op, idx (idx)}
                        <div class="d-flex align-items-center gap-1">
                            <div class="form-check">
                                <input
                                    type="radio"
                                    class="form-check-input"
                                    id={op.id}
                                    name="searchOperator"
                                    value={op.value}
                                    disabled={disabled}
                                    checked={operator === op.value}
                                    onchange={() => operator = op.value}
                                />
                            </div>
                            <label for={op.id} class="mb-0 d-flex gap-1">
                                <span>{op.label}</span>
                                {#if op.tip}
                                <span class="line-align-center" id={`tooltip-${op.id}`}>
                                    <i class="bx bx-info-circle"></i>
                                </span>
                                <BotsharpTooltip target={`tooltip-${op.id}`} placement="top" containerClasses="operator-tooltip">
                                    <div>{op.tip}</div>
                                </BotsharpTooltip>
                                {/if}
                            </label>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="operator-container">
            <div class="operator-item align-items-center gap-5">
                <div class="fw-bold operator-title">Sort by field:</div>
                <div>
                    <input
                        type="text"
                        class="form-control"
                        name="searchSortField"
                        bind:value={sortField}
                        disabled={disabled}
                        maxlength={maxLength}
                    />
                </div>
            </div>
            <div class="operator-item align-items-center gap-5">
                <div class="operator-title"></div>
                <div class="d-flex align-items-center gap-5" style="margin-top: 5px;">
                    {#each sortDirections as op, idx (idx)}
                        <div class="d-flex align-items-center gap-1">
                            <div class="form-check">
                                <input
                                    type="radio"
                                    class="form-check-input"
                                    id={op.id}
                                    name="searchSort"
                                    value={op.value}
                                    disabled={disabled}
                                    checked={sortOrder === op.value}
                                    onchange={() => sortOrder = op.value}
                                />
                            </div>
                            <label for={op.id} class="mb-0 d-flex gap-1">
                                <span>{op.label}</span>
                                {#if op.tip}
                                <span class="line-align-center" id={`tooltip-${op.id}`}>
                                    <i class="bx bx-info-circle"></i>
                                </span>
                                <BotsharpTooltip target={`tooltip-${op.id}`} placement="top" containerClasses="operator-tooltip">
                                    <div>{op.tip}</div>
                                </BotsharpTooltip>
                                {/if}
                            </label>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>
