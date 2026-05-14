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
    class="as-container"
    in:fly={{ y: -10, duration: 500 }}
    out:fly={{ y: -10, duration: 200 }}
>
    <div class="as-toggle-row">
        <label class="as-switch">
            <input
                type="checkbox"
                role="switch"
                disabled={disabled}
                checked={showAdvSearch}
                onchange={e => toggleAdvSearch(e)}
            />
            <span class="as-switch-slider"></span>
        </label>
        <div class="as-toggle-label">
            <div>{'Advanced Filters'}</div>
        </div>
        {#if showAdvSearch}
            <div class="as-tooltip-icon" id="adv-search-tooltip">
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
            class="as-items"
            bind:this={scrollContainer}
            in:fly={{ y: -10, duration: 500 }}
            out:fly={{ y: -10, duration: 200 }}
        >
            <div class="as-item as-header-row">
                <div class="as-item-cb">
                    <div class="as-bold">{''}</div>
                </div>
                <div class="as-item-content">
                    <div class="as-bold">{'Name'}</div>
                </div>
                <div class="as-item-content">
                    <div class="as-bold">{'Value'}</div>
                </div>
                <div class="as-item-content">
                    <div class="as-bold">{'Data type'}</div>
                </div>
                <div class="as-item-remove-spacer"></div>
            </div>
            {#each items as item, idx (item.uuid)}
                <div class="as-item">
                    <div class="as-item-cb">
                        <input
                            type="checkbox"
                            class="as-checkbox"
                            disabled={disabled}
                            checked={item.checked}
                            onchange={e => toggleItem(e, idx)}
                        />
                    </div>
                    <div class="as-item-content" data-label="Name">
                        <input
                            type="text"
                            class="as-input"
                            disabled={!item.checked || disabled}
                            maxlength={maxLength}
                            value={item.key}
                            oninput={e => changeItem(e, idx, 'key')}
                        />
                    </div>
                    <div class="as-item-content" data-label="Value">
                        <input
                            type="text"
                            class="as-input"
                            disabled={!item.checked || disabled}
                            maxlength={maxLength}
                            value={item.value}
                            oninput={e => changeItem(e, idx, 'value')}
                        />
                    </div>
                    <div class="as-item-content" data-label="Data type">
                        <Select
                            tag={'search-payload-data-type-select'}
                            placeholder={'Select'}
                            disabled={!item.checked || disabled}
                            selectedValues={item.data_type ? [item.data_type] : []}
                            options={dataTypeOptions}
                            onselect={e => changeItem(e, idx, 'data_type')}
                        />
                    </div>
                    <div class="as-item-remove">
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <i
                            class="bx bxs-no-entry as-remove-icon"
                            class:hide={items.length === 1}
                            onclick={() => removeItem(idx)}
                        ></i>
                    </div>
                </div>
            {/each}
            {#if items.length < limit}
                <div class="as-item as-add-row">
                    <div class="as-item-cb">
                        <div class="as-bold">{''}</div>
                    </div>
                    <div class="as-item-content">
                        <div class="as-bold">{''}</div>
                    </div>
                    <div class="as-item-content">
                        <div class="as-bold">{''}</div>
                    </div>
                    <div class="as-item-content as-add-wrap">
                        <button
                            type="button"
                            class="as-link-btn"
                            onclick={e => addItem(e)}
                        >
                            {'Add +'}
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <div class="as-operator-container">
            <div class="as-operator-item">
                <div class="as-operator-title">Search operator:</div>
                <div class="as-radio-group">
                    {#each logicalOperators as op, idx (idx)}
                        <div class="as-radio-item">
                            <input
                                type="radio"
                                class="as-radio"
                                id={op.id}
                                name="searchOperator"
                                value={op.value}
                                disabled={disabled}
                                checked={operator === op.value}
                                onchange={() => operator = op.value}
                            />
                            <label for={op.id} class="as-radio-label">
                                <span>{op.label}</span>
                                {#if op.tip}
                                <span class="as-tooltip-icon" id={`tooltip-${op.id}`}>
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

        <div class="as-operator-container">
            <div class="as-operator-item">
                <div class="as-operator-title">Sort by field:</div>
                <div>
                    <input
                        type="text"
                        class="as-input"
                        name="searchSortField"
                        bind:value={sortField}
                        disabled={disabled}
                        maxlength={maxLength}
                    />
                </div>
            </div>
            <div class="as-operator-item">
                <div class="as-operator-title"></div>
                <div class="as-radio-group as-sort-radio-group">
                    {#each sortDirections as op, idx (idx)}
                        <div class="as-radio-item">
                            <input
                                type="radio"
                                class="as-radio"
                                id={op.id}
                                name="searchSort"
                                value={op.value}
                                disabled={disabled}
                                checked={sortOrder === op.value}
                                onchange={() => sortOrder = op.value}
                            />
                            <label for={op.id} class="as-radio-label">
                                <span>{op.label}</span>
                                {#if op.tip}
                                <span class="as-tooltip-icon" id={`tooltip-${op.id}`}>
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


<style>
    /* ===== Container ===== */
    .as-container {
        margin-top: 2rem;
    }

    /* ===== Toggle row ===== */
    .as-toggle-row {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-primary);
        flex-wrap: wrap;
    }
    .as-toggle-label {
        display: inline-flex;
        align-items: center;
    }
    .as-tooltip-icon {
        display: inline-flex;
        align-items: center;
        color: var(--color-muted);
        cursor: help;
    }

    /* ===== Switch ===== */
    .as-switch {
        position: relative;
        display: inline-block;
        width: 2.25rem;
        height: 1.25rem;
        cursor: pointer;
    }
    .as-switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    .as-switch-slider {
        position: absolute;
        inset: 0;
        background-color: rgb(209 213 219);
        border-radius: 999px;
        transition: background-color 0.15s ease;
    }
    .as-switch-slider::before {
        content: '';
        position: absolute;
        height: 0.875rem;
        width: 0.875rem;
        left: 0.1875rem;
        top: 0.1875rem;
        background-color: rgb(255 255 255);
        border-radius: 50%;
        transition: transform 0.2s ease;
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.15);
    }
    .as-switch input:checked + .as-switch-slider {
        background-color: var(--color-primary);
    }
    .as-switch input:checked + .as-switch-slider::before {
        transform: translateX(1rem);
    }
    .as-switch input:disabled + .as-switch-slider {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* ===== Items list ===== */
    .as-items {
        margin-top: 0.9375rem;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        min-height: 200px;
        max-height: 300px;
        overflow-y: auto;
        scrollbar-width: thin;
    }
    .as-item {
        display: flex;
        gap: 0.625rem;
    }
    .as-item-cb {
        flex: 0 0 20px;
        display: flex;
        align-items: center;
    }
    .as-item-content {
        flex: 0.3;
        min-width: 150px;
        max-width: 350px;
        display: flex;
        align-items: center;
    }
    .as-item-remove {
        flex: 0 0 12px;
        display: flex;
        align-items: center;
    }
    .as-item-remove-spacer {
        flex: 0 0 10px;
    }
    .as-bold {
        font-weight: 700;
        color: rgb(55 65 81);
    }
    .as-remove-icon {
        color: var(--color-danger);
        cursor: pointer;
        font-size: 1.125rem;
    }
    .as-remove-icon.hide {
        visibility: hidden;
    }

    /* ===== Checkbox / Input ===== */
    .as-checkbox {
        appearance: none;
        -webkit-appearance: none;
        width: 1rem;
        height: 1rem;
        margin: 0;
        padding: 0;
        background-color: rgb(255 255 255);
        border: 1px solid rgb(209 213 219);
        border-radius: 0.25rem;
        cursor: pointer;
        flex-shrink: 0;
        background-repeat: no-repeat;
        background-position: center;
        background-size: 72%;
        transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .as-checkbox:hover:not(:disabled) {
        border-color: var(--color-primary);
    }
    .as-checkbox:focus-visible {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .as-checkbox:checked {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M3 8l3 3 7-7'/%3E%3C/svg%3E");
    }
    .as-checkbox:disabled {
        cursor: not-allowed;
        opacity: 0.5;
        background-color: rgb(243 244 246);
    }
    .as-input {
        width: 100%;
        height: 2.25rem;
        padding: 0 0.625rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        background-color: rgb(249 250 251);
        font-size: 0.8125rem;
        color: rgb(17 24 39);
        font-family: inherit;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
    }
    .as-input:focus {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .as-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* ===== Add row ===== */
    .as-add-wrap {
        justify-content: flex-end;
    }
    .as-link-btn {
        padding: 0;
        background: transparent;
        border: 0;
        color: var(--color-primary);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        width: fit-content;
    }
    .as-link-btn:hover {
        text-decoration: underline;
    }

    /* ===== Operator/Sort sections ===== */
    .as-operator-container {
        margin-top: 1.25rem;
    }
    .as-operator-item {
        display: flex;
        align-items: center;
        gap: 1.25rem;
    }
    .as-operator-title {
        width: 120px;
        font-weight: 700;
        color: rgb(55 65 81);
    }
    .as-radio-group {
        display: flex;
        align-items: center;
        gap: 1.25rem;
    }
    .as-sort-radio-group {
        margin-top: 0.3rem;
    }
    .as-radio-item {
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }
    .as-radio {
        width: 1rem;
        height: 1rem;
        margin: 0;
        accent-color: var(--color-primary);
        cursor: pointer;
    }
    .as-radio:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
    .as-radio-label {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        margin: 0;
        font-size: 0.8125rem;
        font-weight: 500;
        color: rgb(55 65 81);
        cursor: pointer;
    }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
        .as-item {
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.625rem;
            border: 1px solid rgb(229 231 235);
            border-radius: 0.375rem;
            margin-bottom: 0.3rem;
        }
        .as-item-cb {
            flex: none;
            align-self: flex-start;
        }
        .as-item-content {
            flex: none;
            min-width: unset;
            max-width: unset;
            width: 100%;
            position: relative;
        }
        .as-item-content[data-label]:before {
            content: attr(data-label) ":";
            display: block;
            font-weight: 700;
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
            color: rgb(102 102 102);
        }
        .as-header-row {
            display: none;
        }
        .as-add-row {
            flex-direction: row;
            justify-content: center;
            border: none;
        }
        .as-add-row .as-item-cb,
        .as-add-row .as-item-content:not(:last-child) {
            display: none;
        }
        .as-add-row .as-item-content:last-child {
            flex: none;
            width: auto;
            justify-content: center;
        }
        .as-operator-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.625rem;
        }
        .as-operator-title {
            width: auto;
            margin-bottom: 0.3rem;
        }
    }
    @media (max-width: 480px) {
        .as-toggle-row {
            font-size: 0.95rem;
            gap: 0.5rem;
        }
        .as-item {
            padding: 0.5rem;
            gap: 0.375rem;
        }
    }
    @media (max-width: 420px) {
        .as-operator-item {
            text-align: center;
            align-items: center;
        }
    }

    /* ===== Dark mode ===== */
    :global(.dark) .as-input {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(243 244 246);
    }
    :global(.dark) .as-input:focus {
        background-color: rgb(31 41 55);
    }
    :global(.dark) .as-bold,
    :global(.dark) .as-operator-title,
    :global(.dark) .as-radio-label {
        color: rgb(229 231 235);
    }
    :global(.dark) .as-item {
        border-color: rgb(55 65 81);
    }
    :global(.dark) .as-checkbox {
        background-color: rgb(17 24 39);
        border-color: rgb(75 85 99);
    }
    :global(.dark) .as-checkbox:checked {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
    }
    :global(.dark) .as-checkbox:disabled {
        background-color: rgb(31 41 55);
    }
</style>
