<script>
	import FileGallery from "$lib/common/FileGallery.svelte";
	import { conversationUserAttachmentStore } from "$lib/helpers/store";
	import { afterUpdate, getContext, onDestroy, onMount } from "svelte";

    /** @type {boolean} */
    export let disabled = false;

    /** @type {any[]} */
    let files = [];

    const { autoScrollToBottom }  = getContext('chat-window-context');

    const unsubscribe = conversationUserAttachmentStore.subscribe(value => {
        const savedAttachments = conversationUserAttachmentStore.get();
        files = value.accepted_files?.length > 0 ? value.accepted_files : savedAttachments.accepted_files || [];
    });

    afterUpdate(() => {
        autoScrollToBottom();
    });

    onDestroy(() => {
        unsubscribe();
    });

    /** @param {number} index */
    function deleteFile(index) {
        files = files?.filter((f, idx) => idx !== index) || [];
        conversationUserAttachmentStore.put({
            accepted_files: files
        });
    }
</script>

<div>
    <FileGallery
        containerStyles={'justify-content: center; margin: 5px 10px;'}
        files={files}
        disabled={disabled}
        needDelete
        onDelete={deleteFile} />
</div>

