<script>
    import { onMount } from "svelte";
    import FileDropZone from "$lib/common/FileDropZone.svelte";
    import FileGallery from "$lib/common/FileGallery.svelte";
	import { conversationUserAttachmentStore } from "$lib/helpers/store";

    /** @type {boolean} */
    export let disabled = false;

    /** @type {any[]} */
    let files = [];

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

<div style="display: block; margin-top: 3px;">
    <div style="display: flex; flex-wrap: wrap; gap: 3px;">
        <FileGallery files={files} disabled={disabled} needDelete onDelete={deleteFile} />
        <FileDropZone accept="image/*" disabled={disabled} on:drop={e => handleFileDrop(e)} />
    </div>
</div>

