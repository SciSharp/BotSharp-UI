<script>
    import FileDropZone from "$lib/common/FileDropZone.svelte";
    import FileGallery from "$lib/common/FileGallery.svelte";
	import { conversationUserAttachmentStore } from "$lib/helpers/store";
	import { onMount } from "svelte";

    /** @type {boolean} */
    export let displayComponents = true;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {any[]} */
    export let files = [];

    onMount(() => {
        const savedAttachments = conversationUserAttachmentStore.get();
        files = savedAttachments.acceptedFiles || [];
    });

    /** @param {any} e */
    async function handleFileDrop(e) {
        const { acceptedFiles, fileRejections } = e.detail;
        const savedAttachments = conversationUserAttachmentStore.get();
        const newAttachments = [...savedAttachments.acceptedFiles || [], ...acceptedFiles];
        conversationUserAttachmentStore.put({
            acceptedFiles: newAttachments
        });
        files = newAttachments;
    }

    /** @param {number} index */
    function deleteFile(index) {
        files = files?.filter((f, idx) => idx !== index) || [];
        conversationUserAttachmentStore.put({
            acceptedFiles: files
        });
    }
</script>

{#if displayComponents}
    <FileDropZone accept="image/*" containerStyles={'width: 100%; height: fit-content; min-height: 8rem;'} disabled={disabled} on:drop={e => handleFileDrop(e)} />
    <FileGallery files={files} disabled={disabled} onDelete={deleteFile} />
{/if}