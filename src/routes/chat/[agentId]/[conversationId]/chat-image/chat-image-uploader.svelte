<script>
    import { onDestroy, onMount } from 'svelte';
    import FileDropZone from '$lib/common/FileDropZone.svelte';
	import { conversationUserAttachmentStore } from '$lib/helpers/store';
	

    /** @type {boolean} */
    export let disabled = false;

    /** @type {() => void} */
    export let onFileDrop = () => {};

    /** @type {any[]} */
    let files = [];

    /** @type {boolean} */
    let disableFileDrop = false;

    /** @type {number} */
    let fileUploadLimit = 0;

    const fileUpperLimit = 5;

    const unsubscribe = conversationUserAttachmentStore.subscribe(value => {
        const savedAttachments = $conversationUserAttachmentStore;
        files = value.accepted_files?.length > 0 ? value.accepted_files : savedAttachments?.accepted_files || [];
    });

    onDestroy(() => {
        unsubscribe();
    });

    $: {
        disableFileDrop = disabled || files.length >= fileUpperLimit;
        fileUploadLimit = Math.max(fileUpperLimit - files.length, 0);
    }

    /** @param {any} e */
    async function handleFileDrop(e) {
        const { acceptedFiles } = e.detail;
        const savedAttachments = $conversationUserAttachmentStore;
        const newAttachments = [...savedAttachments.accepted_files || [], ...acceptedFiles];
        conversationUserAttachmentStore.put({
            accepted_files: newAttachments
        });
        onFileDrop?.();
    }
</script>

<div class="chat-file-editor">
    <ul class="list-inline mb-0">
        <li class="list-inline-item">
            <FileDropZone
                accept="image/*,.pdf"
                disableDefaultStyles
                noDrag
                disabled={disableFileDrop}
                fileLimit={fileUploadLimit}
                on:drop={e => handleFileDrop(e)}
            >
                <slot>
                    <span><i class="bx bx-image-add" /></span>
                </slot>
            </FileDropZone>
        </li>
    </ul>
</div>