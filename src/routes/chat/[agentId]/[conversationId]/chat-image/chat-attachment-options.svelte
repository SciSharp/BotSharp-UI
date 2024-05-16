<script>
    import { onDestroy, onMount } from "svelte";
	import { conversationUserAttachmentStore } from "$lib/helpers/store";

    /** @type {any[] | undefined} */
    export let options;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {(args0: string, args1: string) => any} */
    export let onConfirm = () => {};

    /** @type {any[]} */
    let files = [];
    /** @type {any} */
    let confirmOption;
    /** @type {any} */
    let cancelOption;

    const unsubscribe = conversationUserAttachmentStore.subscribe(value => {
        const savedAttachments = conversationUserAttachmentStore.get();
        files = value.accepted_files?.length > 0 ? value.accepted_files : savedAttachments.accepted_files || [];
    });

    onMount(() => {
        collectOptions(options);
        
    });

    onDestroy(() => {
        unsubscribe();
    });


    /** @param {any[] | undefined} options */
    function collectOptions(options) {
        confirmOption = options?.find(op => op.title?.toLowerCase()?.startsWith("yes"));
        cancelOption = options?.find(op => op.title?.toLowerCase()?.startsWith("no"));
        
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
        onConfirm && onConfirm(title, payload);
    }
</script>

<div class="plain-option-container center-option">
    {#if files?.length > 0 && confirmOption}
        <button
            class={`btn btn-sm m-1 ${confirmOption?.is_secondary ? 'btn-outline-secondary': 'btn-outline-primary'}`}
            disabled={disabled}
            on:click={(e) => handleClickOption(e, confirmOption)}
        >
            {confirmOption?.title}
        </button>
    {/if}
    {#if files?.length <= 0 && cancelOption}
        <button
            class={`btn btn-sm m-1 ${cancelOption?.is_secondary ? 'btn-outline-secondary': 'btn-outline-primary'}`}
            disabled={disabled}
            on:click={(e) => handleClickOption(e, cancelOption)}
        >
            {cancelOption?.title}
        </button>
    {/if}
</div>