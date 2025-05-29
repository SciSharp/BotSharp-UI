<script>
	import { onMount, createEventDispatcher, tick, afterUpdate } from "svelte";
    import { Input } from "@sveltestrap/sveltestrap";
    import { clickoutsideDirective } from "$lib/helpers/directives";

    const svelteDispatch = createEventDispatcher();

    /** @type {string} */
    export let tag;

    /** @type {import('$commonTypes').LabelValuePair[]} */
    export let options = [];

    /** @type {boolean} */
    export let selectAll = true;

    /** @type {string} */
    export let searchPlaceholder = '';

    /** @type {string} */
    export let placeholder = '';

    /** @type {string} */
    export let selectedText = '';

    /** @type {string[]} */
    export let selectedLabels;

    /** @type {string} */
    export let containerClasses = "";

    /** @type {string} */
    export let containerStyles = "";

    /** @type {boolean} */
    export let disableDefaultStyles = false;

    /** @type {boolean} */
    export let searchMode = false;

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

    onMount(() => {
        innerOptions = options.map(x => {
            return {
                label: x.label,
                value: x.value,
                checked: false
            }
        });

        refOptions = options.map(x => {
            return {
                label: x.label,
                value: x.value,
                checked: false
            }
        });
    });

    $: {
        innerOptions = innerOptions.map(x => {
            x.checked = !!selectedLabels?.includes(x.label);
            return {...x};
        });
        refOptions = refOptions.map(x => {
            x.checked = !!selectedLabels?.includes(x.label);
            return {...x};
        });
        changeDisplayText();
    }

    $: {
        if (options.length > refOptions.length) {
            const curKeys = refOptions.map(x => x.label);
            const newOptions = options.filter(x => !curKeys.includes(x.label)).map(x => {
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

            changeDisplayText();
        }
    }


    async function toggleOptionList() {
        showOptionList = !showOptionList;
        if (showOptionList) {
            await tick();
            adjustDropdownPosition();
        }
    }


    /** @param {any} e */
    function changeSearchValue(e) {
        searchValue = e.target.value || '';
        if (searchValue) {
            innerOptions = [...refOptions.filter(x => x.value.includes(searchValue))];
        } else {
            innerOptions = [...refOptions];
        }

        verifySelectAll();
    }


    /**
     * @param {any} e
	 * @param {any} option
	 */
    function checkOption(e, option) {
        innerOptions = innerOptions.map(x => {
            if (x.label == option.label) {
                x.checked = e == null ? !x.checked : e.target.checked;
            }
            return { ...x };
        });

        refOptions = refOptions.map(x => {
            if (x.label == option.label) {
                x.checked = e == null ? !x.checked : e.target.checked;
            }
            return { ...x };
        });

        changeDisplayText();
        sendEvent();
    }

    /** @param {any} e */
    function checkSelectAll(e) {
        selectAllChecked = e == null ? !selectAllChecked : e.target.checked;
        innerOptions = innerOptions.map(x => {
            return { ...x, checked: selectAllChecked }
        });

        syncChangesToRef(selectAllChecked);
        changeDisplayText();
        sendEvent();
    }

    /** @param {boolean} checked */
    function syncChangesToRef(checked) {
        const keys = innerOptions.map(x => x.label);
        refOptions = refOptions.map(x => {
            if (keys.includes(x.label)) {
                return {
                    ...x,
                    checked: checked
                };
            }

            return { ...x };
        });
    }

    function changeDisplayText() {
        const count = refOptions.filter(x => x.checked).length;
        if (count === 0) {
            displayText = '';
        } else if (count === options.length) {
            displayText = `All selected ${selectedText} (${count})`;
        } else {
            displayText = `Selected ${selectedText} (${count})`;
        }

        verifySelectAll();
    }

    function verifySelectAll() {
        if (!selectAll) return;

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
</script>


<div
    class="{disableDefaultStyles ? '' : 'multiselect-container'} {containerClasses}"
    style={`${containerStyles}`}
    use:clickoutsideDirective
    on:clickoutside={(/** @type {any} */ e) => handleClickOutside(e)}
>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <ul
        class="display-container"
        id={`multiselect-btn-${tag}`}
        on:click={() => toggleOptionList()}
    >
        <Input
            type="text"
            class='clickable'
            value={displayText}
            placeholder={placeholder}
            readonly
        />
        <div class={`display-suffix ${showOptionList ? 'show-list' : ''}`}>
            <i class="bx bx-chevron-down" />
        </div>
    </ul>
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
                {#if selectAll}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                    <li
                        class="option-item clickable"
                        on:click={() => checkSelectAll(null)}
                    >
                        <div class="line-align-center select-box">
                            <Input
                                type="checkbox"
                                checked={selectAllChecked}
                                on:change={e => checkSelectAll(e)}
                            />
                        </div>
                        <div class="line-align-center select-name fw-bold">
                            {'Select all'}
                        </div>
                    </li>
                {/if}
                {#each innerOptions as option, idx (idx)}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                    <li
                        class="option-item clickable"
                        on:click={() => checkOption(null, option)}
                    >
                        <div class="line-align-center select-box">
                            <Input
                                type="checkbox"
                                checked={option.checked}
                                on:change={e => checkOption(e, option)}
                            />
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