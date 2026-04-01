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

<div class="plain-option-container center-option">
    {#if files?.length > 0 && confirmOption}
        <button
            class={`btn btn-sm m-1 ${confirmOption?.is_secondary ? 'btn-outline-secondary': 'btn-outline-primary'}`}
            disabled={disabled}
            onclick={(e) => handleClickOption(e, confirmOption)}
        >
            {confirmOption?.title}
        </button>
    {/if}
    {#if files?.length <= 0 && cancelOption}
        <button
            class={`btn btn-sm m-1 ${cancelOption?.is_secondary ? 'btn-outline-secondary': 'btn-outline-primary'}`}
            disabled={disabled}
            onclick={(e) => handleClickOption(e, cancelOption)}
        >
            {cancelOption?.title}
        </button>
    {/if}
</div>