<script>
	import { clickoutsideDirective } from "$lib/helpers/directives";
    import _ from "lodash";

    /** @type {string} */
    export let id;

    /** @type {string} */
    export let className = '';

    /** @type {string} */
    export let text;

    /** @type {boolean} */
    export let loadUtils = false;

    /** @type {string[]} */
    export let options = [];

    /** @type {number} */
    export let rows = 1;

    /** @type {number} */
    export let maxLength = 500;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {string} */
    export let placeholder = "Enter Message...";

    /** @type {(args0: any) => void} */
    export let onTextInput = () => {};

    /** @type {(args0: any) => void} */
    export let onKeyDown = () => {};

    /** @type {(args0: any) => void} */
    export let onFocus = () => {};

    /** @type {(option: string) => void} */
    export let onOptionClick = () => {};


    /** @type {HTMLTextAreaElement} */
    let textArea;

    /** @type {boolean} */
    let showOptions = false;

    $: showOptions = options?.length > 0;


    /** @param {any} e */
    function handleClickOutside(e) {
        e.preventDefault();

        const curNode = e.detail.currentNode;
        const targetNode = e.detail.targetNode;

        if (!curNode?.contains(targetNode)) {
            options = [];
            loadUtils = false;
        } else if (targetNode.contains(textArea)) {
            loadUtils = false;
        }
    }

    /** @param {any} e */
    function handleKeyDown(e) {
        onKeyDown?.(e);
    }

    /** @param {any} e */
    function handleFocus(e) {
        onFocus?.(e);
    }
    
    /** @param {string} option */
    function handleOptionClick(option) {
        if (textArea) {
            textArea.focus();
        }

        onOptionClick?.(option);
    }

    /** @param {any} e */
    function handleTextInput(e) {
        onTextInput?.(e);
    }
</script>


<div use:clickoutsideDirective on:clickoutside={handleClickOutside}>
    {#if showOptions}
        <ul class="dropdown-menu chat-option-list chat-util-common">
            {#each options as option, idx (idx)}
                <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <li
                    class="chat-option-item"
                    on:click={() => handleOptionClick(option)}
                >
                    {option}
                </li>
            {/each}
        </ul>
    {/if}
    {#if loadUtils}
        <div class="chat-util-container chat-util-common">
            <slot />
        </div>
    {/if}
    <textarea
        id={id}
        class={`form-control ${className}`}
        rows={rows}
        maxlength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        bind:this={textArea}
        bind:value={text}
        on:input={e => handleTextInput(e)}
        on:keydown={e => handleKeyDown(e)}
        on:focus={e => handleFocus(e)}
    />
</div>
