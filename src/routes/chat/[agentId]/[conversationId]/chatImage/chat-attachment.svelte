<script>
    import { onMount } from "svelte";
    import FileDropZone from "$lib/common/FileDropZone.svelte";
    import FileGallery from "$lib/common/FileGallery.svelte";
	import { conversationUserAttachmentStore } from "$lib/helpers/store";

    /** @type {any[]} */
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
    /** @type {boolean} */
    let disableFileDrop = false;
    /** @type {number} */
    let fileUploadLimit = 0;

    const fileUpperLimit = 5;

    onMount(() => {
        collectOptions(options);
        const savedAttachments = conversationUserAttachmentStore.get();
        files = savedAttachments.accepted_files || [];
        console.log(files);
    });

    $: {
        disableFileDrop = disabled || files.length >= fileUpperLimit;
        fileUploadLimit = Math.max(fileUpperLimit - files.length, 0);
    }


    /** @param {any[]} options */
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

    /** @param {any} e */
    async function handleFileDrop(e) {
        const { acceptedFiles } = e.detail;
        const savedAttachments = conversationUserAttachmentStore.get();
        const newAttachments = [...savedAttachments.accepted_files || [], ...acceptedFiles];
        conversationUserAttachmentStore.put({
            accepted_files: newAttachments
        });
        files = newAttachments;
    }

    /** @param {number} index */
    function deleteFile(index) {
        files = files?.filter((f, idx) => idx !== index) || [];
        conversationUserAttachmentStore.put({
            accepted_files: files
        });
    }
</script>

<div style="display: block; margin-top: 3px;">
    <div style="display: flex; flex-wrap: wrap; gap: 3px;">
        <FileGallery files={files} disabled={disabled} needDelete onDelete={deleteFile} />
        <FileDropZone accept="image/*" disabled={disableFileDrop} fileLimit={fileUploadLimit} on:drop={e => handleFileDrop(e)} />
    </div>
</div>

<div class="plain-option-container">
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