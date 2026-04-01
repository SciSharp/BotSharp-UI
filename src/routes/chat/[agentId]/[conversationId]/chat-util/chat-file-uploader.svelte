<script>
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

    $effect(() => {
        const unsubscribe = conversationUserAttachmentStore.subscribe(value => {
            files = value?.accepted_files || [];
        });

        return () => {
            unsubscribe();
        };
    });

    /** @param {any} e */
    async function handleFileDrop(e) {
        const { acceptedFiles } = e;
        const newAttachments = [...files, ...acceptedFiles];
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