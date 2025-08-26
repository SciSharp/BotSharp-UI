<script>
	import { onMount, createEventDispatcher, tick } from "svelte";
    import { Input } from "@sveltestrap/sveltestrap";
    import { clickoutsideDirective } from "$lib/helpers/directives";

    const svelteDispatch = createEventDispatcher();

    /** @type {string} */
    export let tag;

    /** @type {import('$commonTypes').LabelValuePair[]} */
    export let options = [];

    /** @type {boolean} */
    export let multiSelect = false;

    /** @type {boolean} */
    export let selectAll = true;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {string} */
    export let searchPlaceholder = '';

    /** @type {string} */
    export let placeholder = '';

    /** @type {string} */
    export let selectedText = '';

    /** @type {string[]} */
    export let selectedValues = [];

    /** @type {string} */
    export let containerClasses = "";

    /** @type {string} */
    export let containerStyles = "";

    /** @type {boolean} */
    export let disableDefaultStyles = false;

    /** @type {boolean} */
    export let searchMode = false;

    /** @type {boolean} */
    export let loadMore = false;

    /** @type {null | undefined | (() => Promise<any>)} */
    export let onScrollMoreOptions = null;


    /** @type {string} */
    let searchValue = '';

    /** @type {boolean} */
    let selectAllChecked = false;

    /** @type {boolean} */
    let showOptionList = false;

    /** @type {{label: string, value: string, checked: boolean}[]} */
    let innerOptions = [];

    /** @type {{label: string, value: string, checked: boolean}[]} */
    let refOptions = [];

    /** @type {string} */
    let displayText = '';

    /** @type {boolean} */
    let loading = false;

    /**
     * @type {number | undefined}
     */
    let timer;

    onMount(() => {
        initOptions();
    });

    $: {
        innerOptions = verifySelectedOptions(innerOptions, selectedValues);
        refOptions = verifySelectedOptions(innerOptions, selectedValues);
    }

    $: {
        if (loadMore) {
            if (options.length > refOptions.length) {
                const curKeys = refOptions.map(x => x.value);
                const newOptions = options.filter(x => !curKeys.includes(x.value)).map(x => {
                    return {
                        label: x.label,
                        value: x.value,
                        checked: false
                    };
                });

                innerOptions = [
                    ...innerOptions,
                    ...newOptions
                ];

                refOptions = [
                    ...refOptions,
                    ...newOptions
                ];

            }
        } else {
            innerOptions = verifySelectedOptions(options, selectedValues);
            refOptions = verifySelectedOptions(options, selectedValues);
        }
    }

    $: {
        if (innerOptions && refOptions) {
            applySearchFilter();
            changeDisplayText();
        }
    }

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
        svelteDispatch("select", {
            selecteds: refOptions.filter(x => !!x.checked).map(x => ({ label: x.label, value: x.value }))
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
                onScrollMoreOptions().then(res => {
                    loading = false;
                }).catch(err => {
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
    on:clickoutside={(/** @type {any} */ e) => handleClickOutside(e)}
>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="display-container"
        id={`multiselect-btn-${tag}`}
        on:click={() => toggleOptionList()}
    >
        <Input
            type="text"
            class={`clickable ${disabled ? 'disabled' : ''}`}
            value={displayText}
            placeholder={placeholder}
            disabled={disabled}
            readonly
        />
        <div class={`display-suffix ${showOptionList ? 'show-list' : ''}`}>
            <i class="bx bx-chevron-down" />
        </div>
    </div>
    {#if showOptionList}
        <ul class="option-list" id={`multiselect-list-${tag}`} on:scroll={() => innerScroll()}>
            {#if searchMode}
                <div class="search-box">
                    <div class="search-prefix">
                        <i class="bx bx-search-alt" />
                    </div>
                    <Input
                        type="text"
                        value={searchValue}
                        placeholder={searchPlaceholder}
                        on:input={e => changeSearchValue(e)}
                    />
                </div>
            {/if}
            {#if innerOptions.length > 0}
                {#if selectAll && multiSelect}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                    <li
                        class="option-item clickable"
                        on:click|preventDefault|stopPropagation={() => {
                            checkSelectAll(null);
                        }}
                    >
                        <div class="line-align-center select-box">
                            <Input
                                type="checkbox"
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
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                    <li
                        class="option-item clickable justify-content-center"
                        on:click|preventDefault|stopPropagation={() => {
                            clearSelection();
                        }}
                    >
                        <div class="line-align-center text-secondary">
                            {`Clear selection`}
                        </div>
                    </li>
                {/if}
                {#each innerOptions as option, idx (idx)}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                    <li
                        class="option-item clickable"
                        on:click|preventDefault|stopPropagation={() => {
                            checkOption(null, option);
                        }}
                    >
                        <div class="line-align-center select-box">
                            {#if multiSelect}
                                <Input
                                    type="checkbox"
                                    style="pointer-events: none;"
                                    checked={option.checked}
                                    readonly
                                />
                            {:else if option.checked}
                                <i class="bx bx-check text-primary" />
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