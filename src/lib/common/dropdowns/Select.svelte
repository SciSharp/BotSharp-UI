<script>
    import { onDestroy, onMount, tick, untrack } from "svelte";
    import { clickoutsideDirective } from "$lib/helpers/directives";

    /**
     * @type {{
     *   tag: string,
     *   options?: import('$commonTypes').LabelValuePair[],
     *   multiSelect?: boolean,
     *   selectAll?: boolean,
     *   disabled?: boolean,
     *   searchPlaceholder?: string,
     *   placeholder?: string,
     *   selectedText?: string,
     *   selectedValues?: string[],
     *   containerClasses?: string,
     *   containerStyles?: string,
     *   disableDefaultStyles?: boolean,
     *   searchMode?: boolean,
     *   loadMore?: boolean,
     *   prefixIcon?: import('svelte').Snippet,
     *   onScrollMoreOptions?: null | undefined | (() => Promise<any>),
     *   onselect?: (e: any) => void
     * }}
     */
    let {
        tag,
        options = [],
        multiSelect = false,
        selectAll = true,
        disabled = false,
        searchPlaceholder = '',
        placeholder = '',
        selectedText = '',
        selectedValues = [],
        containerClasses = "",
        containerStyles = "",
        disableDefaultStyles = false,
        searchMode = false,
        loadMore = false,
        prefixIcon = undefined,
        onScrollMoreOptions = null,
        onselect = () => {}
    } = $props();

    /** @type {string} */
    let searchValue = $state('');

    /** @type {boolean} */
    let selectAllChecked = $state(false);

    /** @type {boolean} */
    let showOptionList = $state(false);

    /** @type {{label: string, value: string, checked: boolean}[]} */
    let innerOptions = $state([]);

    /** @type {{label: string, value: string, checked: boolean}[]} */
    let refOptions = $state([]);

    /** @type {string} */
    let displayText = $state('');

    /** @type {boolean} */
    let loading = $state(false);

    /**
     * @type {number | undefined}
     */
    let timer;

    /** @type {number} */
    let repositionRaf = 0;

    onMount(() => {
        initOptions();
    });

    // Belt-and-braces cleanup: if the option list was portaled to <body>
    // and the parent Select is destroyed mid-flight (e.g. route change
    // while the dropdown is open), Svelte's removal walks the original
    // template tree and may miss the moved node. Drop it explicitly.
    onDestroy(() => {
        const optionList = document.getElementById(`multiselect-list-${tag}`);
        if (optionList && optionList.parentElement === document.body) {
            optionList.remove();
        }
    });

    $effect(() => {
        // track options, selectedValues, and loadMore as triggers
        const _opts = options;
        const _sv = selectedValues;
        const _lm = loadMore;

        if (_lm) {
            // Apply selectedValues verification first
            const currentInner = untrack(() => innerOptions);
            let newInner = verifySelectedOptions(currentInner, _sv);
            let newRef = verifySelectedOptions(currentInner, _sv);

            // Append any new options not yet present
            if (_opts.length > newRef.length) {
                const curKeys = newRef.map(x => x.value);
                const addedOptions = _opts.filter(x => !curKeys.includes(x.value)).map(x => ({
                    label: x.label,
                    value: x.value,
                    checked: false
                }));
                newInner = [...newInner, ...addedOptions];
                newRef = [...newRef, ...addedOptions];
            }

            innerOptions = newInner;
            refOptions = newRef;
        } else {
            innerOptions = verifySelectedOptions(_opts, _sv);
            refOptions = verifySelectedOptions(_opts, _sv);
        }

        untrack(() => {
            applySearchFilter();
            changeDisplayText();
        });
    });

    function initOptions() {
        const newInnerOptions = options.map(x => {
            return {
                label: x.label,
                value: x.value,
                checked: false
            }
        });

        const newRefOptions = options.map(x => {
            return {
                label: x.label,
                value: x.value,
                checked: false
            }
        });

        innerOptions = newInnerOptions;
        refOptions = newRefOptions;
    }

    /**
	 * @param {any[]} list
	 * @param {string[]} selecteds
	 */
    function verifySelectedOptions(list, selecteds) {
        return list?.map(x => {
            const item = { ...x, checked: false };
            if (multiSelect) {
                item.checked = !!selecteds?.includes(item.value);
            } else {
                item.checked = selecteds.length > 0 && selecteds[0] === item.value;
            }
            return item;
        }) || [];
    }

    async function toggleOptionList() {
        if (disabled) return;

        showOptionList = !showOptionList;
        if (showOptionList) {
            await tick();
            adjustDropdownPosition();
        }
    }

    

    function adjustDropdownPosition() {
        const btn = document.getElementById(`multiselect-btn-${tag}`);
        const optionList = document.getElementById(`multiselect-list-${tag}`);

        if (!btn || !optionList) return;

        // Portal the option list to <body> so it escapes ancestor
        // containing-block surprises. `position: fixed` is anchored to the
        // viewport *only* when no ancestor sets `transform`, `filter`,
        // `perspective`, `contain: layout/paint/strict`, or `will-change` to
        // a transform-creating value — any of which create a new containing
        // block for fixed-positioned descendants and make
        // getBoundingClientRect-based viewport anchoring drift off the
        // trigger. Re-parenting to <body> guarantees the viewport is the
        // containing block. Also escapes any ancestor `overflow: hidden`.
        if (optionList.parentElement !== document.body) {
            document.body.appendChild(optionList);
        }

        const btnRec = btn.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const listHeight = optionList.offsetHeight;
        const spaceBelow = windowHeight - btnRec.bottom;
        const spaceAbove = btnRec.top;

        optionList.style.position = 'fixed';
        optionList.style.left = `${btnRec.left}px`;
        optionList.style.width = `${btnRec.width}px`;
        optionList.style.right = 'auto';

        if (spaceBelow < listHeight && spaceAbove > listHeight) {
            optionList.style.top = `${btnRec.top - listHeight}px`;
            optionList.style.bottom = 'auto';
        } else {
            optionList.style.top = `${btnRec.bottom}px`;
            optionList.style.bottom = 'auto';
        }
    }

    function repositionDropdown() {
        if (repositionRaf) {
            cancelAnimationFrame(repositionRaf);
        }
        repositionRaf = requestAnimationFrame(() => {
            adjustDropdownPosition();
            repositionRaf = 0;
        });
    }

    $effect(() => {
        if (!showOptionList) return;
        // Capture-phase scroll listener catches nested scroll containers too.
        window.addEventListener('scroll', repositionDropdown, true);
        window.addEventListener('resize', repositionDropdown);
        return () => {
            window.removeEventListener('scroll', repositionDropdown, true);
            window.removeEventListener('resize', repositionDropdown);
            if (repositionRaf) {
                cancelAnimationFrame(repositionRaf);
                repositionRaf = 0;
            }
        };
    });


    /** @param {any} e */
    function changeSearchValue(e) {
        searchValue = e.target.value || '';

        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            applySearchFilter();
            verifySelectAll();
        }, 500);
    }

    function applySearchFilter() {
        const innerValue = searchValue.toLowerCase();

        if (searchValue) {
            innerOptions = [...refOptions.filter(x => x.label.toLowerCase().includes(innerValue))];
        } else {
            innerOptions = [...refOptions];
        }
    }

    /**
     * @param {any} e
	 * @param {any} option
	 */
    function checkOption(e, option) {
        const newInnerOptions = innerOptions.map(x => {
            const item = { ...x };
            if (item.value == option.value) {
                item.checked = e == null ? !item.checked : e.target.checked;
            } else if (!multiSelect) {
                item.checked = false;
            }
            return item;
        });

        const newRefOptions = refOptions.map(x => {
            const item = { ...x };
            if (item.value == option.value) {
                item.checked = e == null ? !item.checked : e.target.checked;
            } else if (!multiSelect) {
                item.checked = false;
            }
            return item;
        });

        innerOptions = newInnerOptions;
        refOptions = newRefOptions;

        sendEvent();
        hideOptionList();
    }

    /** @param {any} e */
    function checkSelectAll(e) {
        selectAllChecked = e == null ? !selectAllChecked : e.target.checked;
        innerOptions = innerOptions.map(x => {
            return { ...x, checked: selectAllChecked }
        });

        syncChangesToRef(selectAllChecked);
        sendEvent();
    }

    /** @param {boolean} checked */
    function syncChangesToRef(checked) {
        const keys = innerOptions.map(x => x.value);
        refOptions = refOptions.map(x => {
            if (keys.includes(x.value)) {
                return {
                    ...x,
                    checked: checked
                };
            }

            return { ...x };
        });
    }

    function changeDisplayText() {
        if (multiSelect) {
            const count = refOptions.filter(x => x.checked).length;
            if (count === 0) {
                displayText = '';
            } else if (count === options.length) {
                displayText = `All selected ${selectedText} (${count})`;
            } else {
                displayText = `Selected ${selectedText} (${count})`;
            }
        } else {
            const selected = refOptions.find(x => x.checked);
            displayText = selected?.label || '';
        }

        verifySelectAll();
    }

    function verifySelectAll() {
        if (!selectAll || !multiSelect) return;

        const innerCount = innerOptions.filter(x => x.checked).length;
        if (innerCount < innerOptions.length) {
            selectAllChecked = false;
        } else if (innerCount === innerOptions.length) {
            selectAllChecked = true;
        }
    }

    /** @param {any} e */
    function handleClickOutside(e) {
        e.preventDefault();

        const curNode = e.detail.currentNode;
        const targetNode = e.detail.targetNode;

        // The option list is portaled to <body> (see adjustDropdownPosition),
        // so `curNode` (the .multiselect-container) no longer contains it.
        // Check the portaled list explicitly so clicks inside it (search
        // box, scrollbar, option rows) are treated as "inside".
        const optionList = document.getElementById(`multiselect-list-${tag}`);
        const insideList = !!optionList && optionList.contains(targetNode);

        if (!curNode?.contains(targetNode) && !insideList) {
            showOptionList = false;
        }
    }

    function sendEvent() {
        onselect?.({
            detail: {
                selecteds: refOptions.filter(x => !!x.checked).map(x => ({ label: x.label, value: x.value }))
            }
        });
    }

    function innerScroll() {
        if (onScrollMoreOptions != null && onScrollMoreOptions != undefined) {
            const dropdown = document.getElementById(`multiselect-list-${tag}`);
            if (!dropdown || loading) return;

            if (dropdown.scrollHeight - dropdown.scrollTop - dropdown.clientHeight <= 1) {
                loading = true;
                onScrollMoreOptions().then(() => {
                    loading = false;
                }).catch(() => {
                    loading = false;
                });
            }
        }
    }

    function clearSelection() {
        const newInnerOptions = innerOptions.map(x => {
            return { ...x, checked: false }
        });

        const newRefOptions = refOptions.map(x => {
            return { ...x, checked: false }
        });

        innerOptions = newInnerOptions;
        refOptions = newRefOptions;

        sendEvent();
        hideOptionList();
    }

    function hideOptionList() {
        if (!multiSelect) {
            showOptionList = false;
        }
    }
</script>


<div
    class="{disableDefaultStyles ? '' : 'multiselect-container'} {containerClasses}"
    style={`${containerStyles}`}
    use:clickoutsideDirective
    onclickoutside={(/** @type {any} */ e) => handleClickOutside(e)}
>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class={`display-container ${prefixIcon ? 'has-prefix' : ''}`}
        id={`multiselect-btn-${tag}`}
        onclick={() => toggleOptionList()}
    >
        {#if prefixIcon}
            <div class="display-prefix">
                {@render prefixIcon()}
            </div>
        {/if}
        <input
            type="text"
            name={'select-display-text'}
            class={`select-display ${disabled ? 'disabled' : ''}`}
            value={displayText}
            placeholder={placeholder}
            disabled={disabled}
            readonly
        />
        <div class={`display-suffix ${showOptionList ? 'show-list' : ''}`}>
            <i class="bx bx-chevron-down"></i>
        </div>
    </div>
    {#if showOptionList}
        <ul class="option-list" id={`multiselect-list-${tag}`} onscroll={() => innerScroll()}>
            {#if searchMode}
                <div class="search-box">
                    <div class="search-prefix">
                        <i class="bx bx-search-alt"></i>
                    </div>
                    <input
                        type="text"
                        name={'select-search-text'}
                        class="select-search"
                        value={searchValue}
                        placeholder={searchPlaceholder}
                        oninput={e => changeSearchValue(e)}
                    />
                </div>
            {/if}
            {#if innerOptions.length > 0}
                {#if selectAll && multiSelect}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <li
                        class="option-item"
                        onclick={(/** @type {MouseEvent} */ e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            checkSelectAll(null);
                        }}
                    >
                        <div class="select-box">
                            <input
                                type="checkbox"
                                name={'select-select-all'}
                                style="pointer-events: none;"
                                checked={selectAllChecked}
                                readonly
                            />
                        </div>
                        <div class="select-name select-name-bold">
                            {'Select all'}
                        </div>
                    </li>
                {/if}
                {#if !multiSelect}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <li
                        class="option-item option-clear"
                        onclick={(/** @type {MouseEvent} */ e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            clearSelection();
                        }}
                    >
                        {`Clear selection`}
                    </li>
                {/if}
                {#each innerOptions as option, idx (idx)}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <li
                        class="option-item"
                        onclick={(/** @type {MouseEvent} */ e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            checkOption(null, option);
                        }}
                    >
                        <div class="select-box">
                            {#if multiSelect}
                                <input
                                    type="checkbox"
                                    name={`select-checkbox-${option.value}`}
                                    style="pointer-events: none;"
                                    checked={option.checked}
                                    readonly
                                />
                            {:else if option.checked}
                                <i class="bx bx-check"></i>
                            {:else}
                                {' '}
                            {/if}
                        </div>
                        <div class="select-name">
                            {option.label}
                        </div>
                    </li>
                {/each}
            {:else}
                <li class="option-item">
                    <div class='nothing'>Nothing...</div>
                </li>
            {/if}
        </ul>
    {/if}
</div>

<style>
    /* ============================================================
       Select component — fully self-contained styling.
       Component-scoped CSS replaces the legacy `_select.scss` rules
       and now owns the full input look (no Bootstrap `.form-control`,
       `.fw-bold`, `.text-*`, `.justify-content-*` classes used).
       Page-level :global() overrides (e.g. in instruction/testing,
       conversation, instruction/log) continue to win via their
       higher-specificity ancestor selectors.
       ============================================================ */

    .multiselect-container {
        position: relative;
    }

    /* ---------- Display container (closed trigger) ---------- */
    .display-container {
        position: relative;
    }

    /* Themed display input. Targets the unstyled `<input type="text">`
       rendered inside the trigger (carries an internal `.select-display`
       class as a JS-only marker; no Bootstrap `.form-control` used). */
    .display-container :global(input[type='text']) {
        width: 100%;
        height: 2.5rem;
        margin: 0;
        padding: 0 2rem 0 0.75rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        background-color: rgb(255 255 255);
        font-size: 0.875rem;
        line-height: 1.5;
        color: rgb(31 41 55);
        cursor: pointer;
        text-overflow: ellipsis;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
    }
    /* When a prefix icon is rendered, reserve left padding so the
       placeholder/value text doesn't collide with the icon. */
    .display-container.has-prefix :global(input[type='text']) {
        padding-left: 2.25rem;
    }

    /* ---------- Optional prefix icon ---------- */
    .display-prefix {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        font-size: 1rem;
        line-height: 1;
        color: rgb(156 163 175);
        pointer-events: none;
        z-index: 1;
        transition: color 0.15s ease;
    }
    /* Lift the prefix icon to primary when the field is focused (and
       not disabled), matching the focus-ring affordance. */
    .display-container:focus-within .display-prefix {
        color: var(--color-primary);
    }
    .display-container :global(input[type='text']::placeholder) {
        color: var(--color-muted);
        opacity: 1;
    }
    .display-container :global(input[type='text']:hover:not(.disabled):not(:disabled)) {
        border-color: rgb(209 213 219);
    }
    .display-container :global(input[type='text']:focus) {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 1px var(--color-primary);
    }
    .display-container :global(input[type='text'].disabled),
    .display-container :global(input[type='text']:disabled) {
        background-color: rgb(249 250 251);
        color: var(--color-muted);
        cursor: not-allowed;
        opacity: 0.7;
        border-color: rgb(229 231 235);
    }

    .display-suffix {
        position: absolute;
        right: 0.625rem;
        top: 50%;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        font-size: 1.125rem;
        line-height: 1;
        color: rgb(156 163 175);
        pointer-events: none;
    }
    .display-suffix :global(i) {
        transition: transform 0.2s ease-in-out, color 0.15s ease;
    }
    .display-suffix.show-list :global(i) {
        transform: rotate(180deg);
        color: var(--color-primary);
    }

    /* ---------- Option list dropdown ---------- */
    .option-list {
        list-style: none;
        margin: 0.25rem 0 0;
        padding: 0.25rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.5rem;
        background-color: rgb(255 255 255);
        box-shadow:
            0 10px 25px -5px rgb(0 0 0 / 0.1),
            0 8px 10px -6px rgb(0 0 0 / 0.05);
        max-height: 260px;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-width: thin;
        /* position / top / left / width are set inline by adjustDropdownPosition()
           so the menu can escape ancestor `overflow: auto/hidden` containers. */
        position: fixed;
        z-index: 1050;
    }

    /* ---------- Search box inside dropdown ---------- */
    .search-box {
        position: relative;
        padding: 0.125rem 0.125rem 0.5rem;
    }
    .search-box :global(input[type='text']) {
        width: 100%;
        height: 2rem;
        margin: 0;
        padding: 0 0.625rem 0 2rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        background-color: rgb(249 250 251);
        font-size: 0.8125rem;
        line-height: 1.5;
        color: rgb(31 41 55);
        transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
    }
    .search-box :global(input[type='text']::placeholder) {
        color: var(--color-muted);
        opacity: 1;
    }
    .search-box :global(input[type='text']:focus) {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 1px var(--color-primary);
    }

    .search-prefix {
        position: absolute;
        left: 0.625rem;
        top: calc(50% - 0.25rem);
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        font-size: 1rem;
        line-height: 1;
        color: rgb(156 163 175);
        pointer-events: none;
        z-index: 1;
    }

    /* ---------- Option items ---------- */
    .option-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.625rem;
        margin: 0;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        color: rgb(31 41 55);
        cursor: pointer;
        transition: background-color 0.12s ease, color 0.12s ease;
    }
    .option-item:hover {
        background-color: rgb(243 244 246);
        color: var(--color-primary);
    }

    /* "Clear selection" row (single-select dropdowns) */
    .option-item.option-clear {
        justify-content: center;
        font-size: 0.8125rem;
        color: var(--color-muted);
        font-style: italic;
    }
    .option-item.option-clear:hover {
        background-color: rgb(243 244 246);
        color: var(--color-danger);
    }

    .select-box {
        flex: 0 0 1.25rem;
        max-width: 1.25rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
    }

    /* ---------- Custom checkbox (multi-select mode) ----------
       Replaces the native browser checkbox with a themed primary-colored
       control. Uses `appearance: none` + an SVG checkmark background to
       render identically across browsers and pick up `--color-primary`
       at runtime. Targets the inputs rendered by the template
       (`<input type="checkbox" ... readonly>`); click handling lives on
       the parent `.option-item`, so the input remains visually accurate
       via its `checked` attribute. */

    .select-box :global(input[type='checkbox']) {
        appearance: none;
        -webkit-appearance: none;
        width: 1rem;
        height: 1rem;
        margin: 0;
        padding: 0;
        border: 1.5px solid rgb(209 213 219);
        border-radius: 0.25rem;
        background-color: rgb(255 255 255);
        background-position: center;
        background-repeat: no-repeat;
        background-size: 0.75rem 0.75rem;
        cursor: pointer;
        outline: 0;
        box-shadow: none;
        transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        flex-shrink: 0;
    }

    /* Hover: lift the border toward primary (skipped when disabled) */
    .option-item:hover :global(input[type='checkbox']:not(:disabled)) {
        border-color: var(--color-primary);
    }

    /* Checked: primary fill + inline white SVG check glyph */
    .select-box :global(input[type='checkbox']:checked) {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='3.5 8.5 6.5 11.5 12.5 5'/%3E%3C/svg%3E");
    }

    /* Disabled: faded with no hover affordance */
    .select-box :global(input[type='checkbox']:disabled) {
        background-color: rgb(243 244 246);
        border-color: rgb(229 231 235);
        cursor: not-allowed;
        opacity: 0.7;
    }

    /* Subtle highlight on rows whose checkbox is checked (multi-select).
       :has() is supported in all evergreen browsers. */
    .option-item:has(:global(input[type='checkbox']:checked)) {
        background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
    }
    .option-item:has(:global(input[type='checkbox']:checked)):hover {
        background-color: color-mix(in srgb, var(--color-primary) 14%, transparent);
        color: var(--color-primary);
    }

    /* The check glyph rendered for the currently-selected option in single-select mode */
    .select-box :global(i.bx-check) {
        font-size: 1.125rem;
        line-height: 1;
        color: var(--color-primary);
    }

    .select-name {
        flex: 1 1 auto;
        min-width: 0;
        font-size: 0.875rem;
        line-height: 1.4;
        word-break: break-word;
        overflow-wrap: anywhere;
    }
    /* "Select all" label is bold (template applies `select-name-bold`
       instead of the legacy Bootstrap `fw-bold` utility class). */
    .select-name.select-name-bold {
        font-weight: 600;
    }

    /* Empty state ("Nothing...") */
    .option-item :global(.nothing) {
        width: 100%;
        padding: 0.25rem 0.25rem;
        color: var(--color-muted);
        font-size: 0.8125rem;
        font-style: italic;
        text-align: center;
    }
</style>
