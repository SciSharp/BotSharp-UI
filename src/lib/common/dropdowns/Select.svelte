<script>
    import { onMount, tick, untrack } from "svelte";
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

    onMount(() => {
        initOptions();
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

        if (!curNode?.contains(targetNode)) {
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

    function adjustDropdownPosition() {
        const btn = document.getElementById(`multiselect-btn-${tag}`);
        const optionList = document.getElementById(`multiselect-list-${tag}`);

        if (!btn || !optionList) return;

        const btnRec = btn.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - btnRec.bottom;
        const spaceAbove = btnRec.top;
        const listHeight = optionList.offsetHeight;

        if (spaceBelow < listHeight && spaceAbove > listHeight) {
            optionList.style.top = `-${listHeight}px`;
            optionList.style.bottom = 'auto';
        }
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
        class="display-container"
        id={`multiselect-btn-${tag}`}
        onclick={() => toggleOptionList()}
    >
        <input
            type="text"
            name={'select-display-text'}
            class={`form-control clickable ${disabled ? 'disabled' : ''}`}
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
                        class="form-control"
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
                        class="option-item clickable"
                        onclick={(/** @type {MouseEvent} */ e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            checkSelectAll(null);
                        }}
                    >
                        <div class="line-align-center select-box">
                            <input
                                type="checkbox"
                                name={'select-select-all'}
                                style="pointer-events: none;"
                                checked={selectAllChecked}
                                readonly
                            />
                        </div>
                        <div class="line-align-center select-name fw-bold">
                            {'Select all'}
                        </div>
                    </li>
                {/if}
                {#if !multiSelect}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <li
                        class="option-item clickable justify-content-center"
                        onclick={(/** @type {MouseEvent} */ e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            clearSelection();
                        }}
                    >
                        <div class="line-align-center text-secondary">
                            {`Clear selection`}
                        </div>
                    </li>
                {/if}
                {#each innerOptions as option, idx (idx)}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <li
                        class="option-item clickable"
                        onclick={(/** @type {MouseEvent} */ e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            checkOption(null, option);
                        }}
                    >
                        <div class="line-align-center select-box">
                            {#if multiSelect}
                                <input
                                    type="checkbox"
                                    name={`select-checkbox-${option.value}`}
                                    style="pointer-events: none;"
                                    checked={option.checked}
                                    readonly
                                />
                            {:else if option.checked}
                                <i class="bx bx-check text-primary"></i>
                            {:else}
                                {' '}
                            {/if}
                        </div>
                        <div class="line-align-center select-name">
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