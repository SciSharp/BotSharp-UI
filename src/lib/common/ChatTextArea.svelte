<script>
	import { clickOutside } from "$lib/helpers/directives";
	import { EditorType } from "$lib/helpers/enums";
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

    /** @type {string} */
    export let editor;

    /** @type {(args0: any) => void} */
    export let onKeyDown = () => {}

    /** @type {number} */
    let timeout;

    /** @type {string[]} */
    let options = [];

    /** @type {HTMLTextAreaElement} */
    let textArea;

    const delay = 500;


    /** @param {any} e */
    function handleClickOutside(e) {
        e.preventDefault();
        options = [];
    }

    /** @param {any} e */
    function handleKeyDown(e) {
        onKeyDown && onKeyDown(e);
    }

    function handleFocus() {
        options = [];
    }
    
    /** @param {string} option */
    function handleOptionClick(option) {
        options = [];
        text = option;
        if (textArea) {
            textArea.focus();
        }
    }

    /** @param {any} e */
    function handleTextChange(e) {
        const value = e.target.value;
        if (!!!_.trim(value)) {
            return;
        }

        clearTimeout(timeout);
        options = [];
        if (editor === EditorType.Address) {
            timeout = setTimeout(() => {
                // @ts-ignore
                getAddressOptions(value).then(res => {
                    // @ts-ignore
                    const data = res?.results?.map(x => x.formatted_address) || [];
                    options = data.filter(Boolean).slice(0, optionLimit);
                }).catch(err => {
                    options = [];
                });
            }, delay);
        }
    }
</script>


<div use:clickOutside on:click_outside={handleClickOutside}>
    {#if options?.length > 0}
    <ul class="dropdown-menu chat-option-list">
        {#each options as option, idx (idx)}
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <li
                class="chat-option-item"
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
        bind:this={textArea}
        bind:value={text}
        on:input={e => handleTextChange(e)}
        on:keydown={e => handleKeyDown(e)}
        on:focus={() => handleFocus()}
    />
</div>
