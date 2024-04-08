<script>
    import FileDropZone from "$lib/common/FileDropZone.svelte";
    import FileGallery from "$lib/common/FileGallery.svelte";
	import { conversationUserAttachmentStore } from "$lib/helpers/store";
    import { page } from '$app/stores';
	import { onMount } from "svelte";

    /** @type {boolean} */
    export let displayComponents = true;

    /** @type {boolean} */
    export let disabled = false;

    onMount(() => {
        const conversationId = $page.params.conversationId;
        const savedAttachments = conversationUserAttachmentStore.get(conversationId);
        files = savedAttachments.acceptedFiles || [];
    });

    /** @type {any[]} */
    let files = [];

    /** @param {any} e */
    async function handleFileDrop(e) {
        const { acceptedFiles, fileRejections } = e.detail;
        const conversationId = $page.params.conversationId;
        const savedAttachments = conversationUserAttachmentStore.get(conversationId);
        const newAttachments = [...savedAttachments.acceptedFiles || [], ...acceptedFiles];
        conversationUserAttachmentStore.put(conversationId, {
            conversationId: conversationId,
            acceptedFiles: newAttachments
        });
        files = newAttachments;
    }

    /** @param {number} index */
    function deleteFile(index) {
        files = files?.filter((f, idx) => idx !== index) || [];
        const conversationId = $page.params.conversationId;
        conversationUserAttachmentStore.put(conversationId, {
            conversationId: conversationId,
            acceptedFiles: files
        });
    }
</script>

{#if displayComponents}
    <FileDropZone accept="image/*" disabled={disabled} on:drop={e => handleFileDrop(e)} />
    <FileGallery files={files} disabled={disabled} onDelete={deleteFile} />
{/if}