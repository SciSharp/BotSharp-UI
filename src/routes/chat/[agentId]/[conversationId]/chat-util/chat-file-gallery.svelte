<script>
	import FileGallery from "$lib/common/files/FileGallery.svelte";
	import { conversationUserAttachmentStore } from "$lib/helpers/store";
	import { getContext } from "svelte";

    /**
     * @type {{
     *   disabled?: boolean
     * }}
     */
    let {
        disabled = false
    } = $props();

    /** @type {import('$fileTypes').TextFileModel[]} */
    let files = $state([]);

    const { autoScrollToBottom } = getContext('chat-window-context');

    $effect(() => {
        const unsubscribe = conversationUserAttachmentStore.subscribe(value => {
            files = value?.accepted_files || [];
        });

        return () => {
            unsubscribe();
        };
    });

    $effect(() => {
        // Track files changes to auto-scroll
        files;
        autoScrollToBottom();
    });

    /** @param {number} index */
    function deleteFile(index) {
        files = files?.filter((f, idx) => idx !== index) || [];
        conversationUserAttachmentStore.put({
            accepted_files: files
        });
    }
</script>

<FileGallery
    containerStyles={'justify-content: center; margin: 5px 10px;'}
    files={files}
    disabled={disabled}
    needDelete
    onDelete={(index) => deleteFile(index)}
/>