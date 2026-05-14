<script>
    import { onMount } from "svelte";
	import { conversationUserAttachmentStore } from "$lib/helpers/store";

    /**
     * @type {{
     *   options?: any[],
     *   disabled?: boolean,
     *   onConfirm?: (title: string, payload: string) => any
     * }}
     */
    let {
        options,
        disabled = false,
        onConfirm = () => {}
    } = $props();

    /** @type {any[]} */
    let files = $state([]);
    /** @type {any} */
    let confirmOption = $state(undefined);
    /** @type {any} */
    let cancelOption = $state(undefined);

    $effect(() => {
        const unsubscribe = conversationUserAttachmentStore.subscribe(value => {
            files = value?.accepted_files || [];
        });

        return () => {
            unsubscribe();
        };
    });

    onMount(() => {
        collectOptions(options);
    });

    /** @param {any[] | undefined} opts */
    function collectOptions(opts) {
        confirmOption = opts?.find(op => op.title?.toLowerCase()?.startsWith("yes"));
        cancelOption = opts?.find(op => op.title?.toLowerCase()?.startsWith("no"));

        if (!confirmOption) {
            confirmOption = {
                title: 'Yes, I have uploaded attachments.',
                payload: 'I have uploaded attachments.'
            };
        }

        if (!cancelOption) {
            cancelOption = {
                title: 'No, I do not have attachments to upload.',
                payload: 'No, I do not have attachments to upload.'
            };
        }
    }

    /**
	 * @param {any} e
     * @param {any} option
	 */
    function handleClickOption(e, option) {
        e.preventDefault();
        innerConfirm(option.title, option.payload);
    }

    /**
	 * @param {string} title
     * @param {string} payload
	 */
    function innerConfirm(title, payload) {
        onConfirm?.(title, payload);
    }
</script>

<div class="cao-wrap cao-center">
    {#if files?.length > 0 && confirmOption}
        <button
            class={`cao-btn ${confirmOption?.is_secondary ? 'cao-btn-secondary': 'cao-btn-primary'}`}
            disabled={disabled}
            onclick={(e) => handleClickOption(e, confirmOption)}
        >
            {confirmOption?.title}
        </button>
    {/if}
    {#if files?.length <= 0 && cancelOption}
        <button
            class={`cao-btn ${cancelOption?.is_secondary ? 'cao-btn-secondary': 'cao-btn-primary'}`}
            disabled={disabled}
            onclick={(e) => handleClickOption(e, cancelOption)}
        >
            {cancelOption?.title}
        </button>
    {/if}
</div>

<style>
    /* Replaces legacy .plain-option-container + .center-option */
    .cao-wrap {
        display: flex;
        flex-wrap: wrap;
    }
    .cao-center {
        justify-content: center;
        padding: 0 0.625rem;
    }

    /* Replaces .btn .btn-sm .m-1 with a themed outline button */
    .cao-btn {
        margin: 0.25rem;
        min-width: 50px;
        padding: 0.3125rem 0.75rem;
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1.4;
        border: 1px solid transparent;
        border-radius: 0.625rem;
        background-color: transparent;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .cao-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .cao-btn:focus-visible {
        outline: 0;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }

    /* Replaces .btn-outline-primary */
    .cao-btn-primary {
        color: var(--color-primary);
        border-color: var(--color-primary);
    }
    .cao-btn-primary:hover:not(:disabled) {
        background-color: var(--color-primary);
        color: rgb(255 255 255);
    }

    /* Replaces .btn-outline-secondary */
    .cao-btn-secondary {
        color: var(--color-secondary);
        border-color: var(--color-secondary);
    }
    .cao-btn-secondary:hover:not(:disabled) {
        background-color: var(--color-secondary);
        color: rgb(255 255 255);
    }

    /* ===== Dark mode ===== */
    :global(.dark) .cao-btn-primary {
        color: color-mix(in srgb, var(--color-primary) 80%, rgb(255 255 255));
        border-color: color-mix(in srgb, var(--color-primary) 80%, rgb(255 255 255));
    }
    :global(.dark) .cao-btn-secondary {
        color: rgb(229 231 235);
        border-color: rgb(107 114 128);
    }
</style>