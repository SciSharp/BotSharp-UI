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
    class={`cfu-root ${containerClasses}`}
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
            <span class="cfu-fallback">
                <i
                    class="bx bx-image-add cursor-pointer"
                    title="Upload files"
                ></i>
            </span>
        {/if}
    </FileDropZone>
</div>

<style>
    /* ===== Chat file uploader =====
       Tiny wrapper around <FileDropZone> that ChatBox embeds inside the
       textarea util menu. The actual trigger glyph is supplied by the
       parent via the `children` snippet; the fallback below renders only
       when no snippet is passed (e.g. for ad-hoc consumers). */
    .cfu-root {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
    }
    .cfu-fallback {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--color-primary);
        font-size: 1.25rem;
    }
</style>