<script>
	import { clientOutSide } from "$lib/helpers/directives";
	import { getAddressOptions } from "$lib/services/conversation-service";
    import _ from "lodash";

    /** @type {string} */
    export let className = '';

    /** @type {string} */
    export let text;

    /** @type {number} */
    export let rows = 1;

    /** @type {number} */
    export let maxLength = 500;

    /** @type {number} */
    export let optionLimit = 5;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {string} */
    export let placeholder = "Enter Message...";

    /** @type {(args0: any) => void} */
    export let onKeyDown = () => {}

    /** @type {boolean} */
    let displayOptions = false;

    /** @type {number} */
    let timeout;

    /** @type {string[]} */
    let options = [];


    /** @param {any} e */
    function handleClickOutSide(e) {
        e.preventDefault();
        displayOptions = false;
    }

    /** @param {any} e */
    function handleKeyDown(e) {
        onKeyDown && onKeyDown(e);
    }
    
    /** @param {string} option */
    function handleOptionClick(option) {
        displayOptions = false;
        text = option;
    }

    /** @param {any} e */
    function handleTextChange(e) {
        displayOptions = false;
        clearTimeout(timeout);
        if (!!_.trim(e.target.value)) {
            timeout = setTimeout(() => {
                // @ts-ignore
                getAddressOptions(e.target.value).then(res => {
                    // @ts-ignore
                    const data = res?.results?.map(x => x.formatted_address) || [];
                    options = data.filter(Boolean).slice(0, optionLimit);
                    displayOptions = options?.length > 0;
                });
            }, 350);
        }
    }
</script>


<div use:clientOutSide on:clickOutSide={handleClickOutSide}>
    {#if displayOptions}
    <ul class="dropdown-menu option-list">
        {#each options as option, idx (idx)}
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <li
                class="option-item"
                on:keydown={() => {}}
                on:click={() => handleOptionClick(option)}
            >
                {option}
            </li>
        {/each}
    </ul>
    {/if}
    <textarea
        class={`form-control ${className}`}
        rows={rows}
        maxlength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        bind:value={text}
        on:input={e => handleTextChange(e)}
        on:keydown={e => handleKeyDown(e)}
    />
</div>

<style>
    .option-list {
        display: block;
        position: absolute;
        bottom: 100%;
        max-width: 100%;
        z-index: 10;
        padding: 8px 0px;
        font-size: 0.8rem;
        border-radius: 5px;
    }

    .option-item {
        padding: 5px 15px;
        cursor: pointer;
    }

    .option-item:hover {
        background-color: #e1e4eb;
    }
</style>