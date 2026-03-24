<script>
    import { onDestroy } from 'svelte';
    import FileDropZone from '$lib/common/files/FileDropZone.svelte';
	import { conversationUserAttachmentStore } from '$lib/helpers/store';

    /**
     * @type {{
     *   accept?: string,
     *   fileMaxSize?: number,
     *   disabled?: boolean,
     *   containerClasses?: string,
     *   containerStyles?: string,
     *   onfiledroped?: () => void,
     *   children?: import('svelte').Snippet
     * }}
     */
    let {
        accept = '',
        fileMaxSize = 10 * 1024 * 1024,
        disabled = false,
        containerClasses = '',
        containerStyles = '',
        onfiledroped,
        children
    } = $props();

    /** @type {any[]} */
    let files = $state([]);

    const fileUpperLimit = 5;

    let disableFileDrop = $derived(disabled || files.length >= fileUpperLimit);
    let localFileUploadLimit = $derived(Math.max(fileUpperLimit - files.length, 0));

    const unsubscribe = conversationUserAttachmentStore.subscribe(value => {
        const savedAttachments = $conversationUserAttachmentStore;
        files = value.accepted_files?.length > 0 ? value.accepted_files : savedAttachments?.accepted_files || [];
    });

    onDestroy(() => {
        unsubscribe();
    });

    /** @param {any} e */
    async function handleFileDrop(e) {
        const { acceptedFiles } = e;
        const savedAttachments = $conversationUserAttachmentStore;
        const newAttachments = [...savedAttachments?.accepted_files || [], ...acceptedFiles];
        conversationUserAttachmentStore.put({
            accepted_files: newAttachments
        });
        onfiledroped?.();
    }
</script>

<div
    class={`${containerClasses}`}
    style={`${containerStyles}`}
>
    <FileDropZone
        accept={accept}
        disableDefaultStyles
        noDrag
        disabled={disableFileDrop}
        fileLimit={localFileUploadLimit}
        maxSize={fileMaxSize}
        ondrop={handleFileDrop}
    >
        {#if children}
            {@render children()}
        {:else}
            <span>
                <i
                    class="bx bx-image-add"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Upload files"
                ></i>
            </span>
        {/if}
    </FileDropZone>
</div>