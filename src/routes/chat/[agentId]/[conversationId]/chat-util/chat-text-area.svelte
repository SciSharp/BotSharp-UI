<script>
	import { clickoutsideDirective } from "$lib/helpers/directives";

    /**
     * @type {{
     *   id: string,
     *   className?: string,
     *   text?: string,
     *   loadUtils?: boolean,
     *   options?: string[],
     *   rows?: number,
     *   maxLength?: number,
     *   disabled?: boolean,
     *   placeholder?: string,
     *   onTextInput?: (e: any) => void,
     *   onKeyDown?: (e: any) => void,
     *   onFocus?: (e: any) => void,
     *   onOptionClick?: (option: string) => void,
     *   children?: import('svelte').Snippet
     * }}
     */
    let {
        id,
        className = '',
        text = $bindable(''),
        loadUtils = $bindable(false),
        options = $bindable([]),
        rows = 1,
        maxLength = 500,
        disabled = false,
        placeholder = 'Enter Message...',
        onTextInput = () => {},
        onKeyDown = () => {},
        onFocus = () => {},
        onOptionClick = () => {},
        children
    } = $props();

    /** @type {HTMLTextAreaElement} */
    let textArea;

    let showOptions = $derived(options?.length > 0);

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


<div use:clickoutsideDirective onclickoutside={handleClickOutside}>
    {#if showOptions}
        <ul class="dropdown-menu chat-option-list chat-util-common">
            {#each options as option, idx (idx)}
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <li
                    class="chat-option-item"
                    onclick={() => handleOptionClick(option)}
                >
                    {option}
                </li>
            {/each}
        </ul>
    {/if}
    {#if loadUtils}
        <div class="chat-util-container chat-util-common">
            {#if children}
                {@render children()}
            {/if}
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
        oninput={e => handleTextInput(e)}
        onkeydown={e => handleKeyDown(e)}
        onfocus={e => handleFocus(e)}
    ></textarea>
</div>
