<script>
    import { onDestroy, createEventDispatcher } from 'svelte';
    import FileDropZone from '$lib/common/FileDropZone.svelte';
	import { conversationUserAttachmentStore } from '$lib/helpers/store';

    const svelteDispatch = createEventDispatcher();
	
    /** @type {string} */
    export let accept;

    export let fileMaxSize = 10 * 1024 * 1024;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {string} */
    export let containerClasses = "";

    /** @type {string} */
    export let containerStyles = "";

    /** @type {any[]} */
    let files = [];

    /** @type {boolean} */
    let disableFileDrop = false;

    /** @type {number} */
    let localFileUploadLimit = 0;

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
        localFileUploadLimit = Math.max(fileUpperLimit - files.length, 0);
    }

    /** @param {any} e */
    async function handleFileDrop(e) {
        const { acceptedFiles } = e.detail;
        const savedAttachments = $conversationUserAttachmentStore;
        const newAttachments = [...savedAttachments?.accepted_files || [], ...acceptedFiles];
        conversationUserAttachmentStore.put({
            accepted_files: newAttachments
        });
        svelteDispatch('filedroped');
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
        on:drop={e => handleFileDrop(e)}
    >
        <slot>
            <span>
                <i
                    class="bx bx-image-add"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Upload files"
                />
            </span>
        </slot>
    </FileDropZone>
</div>