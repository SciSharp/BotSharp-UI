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


<div class="cta-wrap" use:clickoutsideDirective onclickoutside={handleClickOutside}>
    {#if showOptions}
        <ul class="cta-option-list cta-popup">
            {#each options as option, idx (idx)}
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <li
                    class="cta-option-item"
                    onclick={() => handleOptionClick(option)}
                >
                    {option}
                </li>
            {/each}
        </ul>
    {/if}
    {#if loadUtils}
        <div class="cta-util-container cta-popup">
            {#if children}
                {@render children()}
            {/if}
        </div>
    {/if}
    <textarea
        id={id}
        class={`cta-textarea ${className}`}
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

<style>
    /* ===== Wrapper =====
       Provides the positioning anchor for the absolutely-positioned
       option list and util container popups (replaces the absolute
       anchoring previously provided by .chat-util-common). */
    .cta-wrap {
        position: relative;
    }

    /* ===== Popup container (replaces .chat-util-common) ===== */
    .cta-popup {
        position: absolute;
        bottom: 100%;
        left: 0;
        right: 0;
        max-width: 100%;
        max-height: 25em;
        z-index: 99;
        font-size: 0.8rem;
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.5rem;
        box-shadow:
            0 10px 25px -5px rgb(15 23 42 / 0.12),
            0 8px 10px -6px rgb(15 23 42 / 0.05);
        overflow-y: auto;
        scrollbar-width: thin;
    }

    /* ===== Option list (replaces .dropdown-menu .chat-option-list) ===== */
    .cta-option-list {
        list-style: none;
        padding: 0.25rem 0;
        margin: 0 0 0.25rem 0;
    }
    .cta-option-item {
        padding: 0.375rem 0.9375rem;
        cursor: pointer;
        color: rgb(17 24 39);
        transition: background-color 0.15s ease, color 0.15s ease;
    }
    .cta-option-item:hover {
        background-color: var(--color-primary);
        color: rgb(255 255 255);
    }

    /* ===== Util container (replaces .chat-util-container) ===== */
    .cta-util-container {
        display: flex;
        gap: 1.25rem;
        justify-content: center;
        flex-wrap: wrap;
        width: 100%;
        height: fit-content;
        padding: 0.625rem 0.9375rem;
        margin-bottom: 0.25rem;
    }

    /* ===== Themed textarea (replaces Bootstrap .form-control) ===== */
    .cta-textarea {
        display: block;
        width: 100%;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        line-height: 1.5;
        color: rgb(17 24 39);
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.5rem;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .cta-textarea:focus {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .cta-textarea:disabled {
        background-color: rgb(243 244 246);
        cursor: not-allowed;
        color: var(--color-muted);
    }
    .cta-textarea::placeholder {
        color: var(--color-muted);
        opacity: 0.85;
    }

    /* ===== Dark mode ===== */
    :global(.dark) .cta-popup {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .cta-option-item {
        color: rgb(229 231 235);
    }
    :global(.dark) .cta-textarea {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .cta-textarea:disabled {
        background-color: rgb(31 41 55);
    }
</style>
