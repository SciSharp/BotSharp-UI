<script>
    import { onMount, onDestroy } from 'svelte';
    import { fly } from 'svelte/transition';
	import { Tooltip } from '@sveltestrap/sveltestrap';
    import Swal from 'sweetalert2';
    import FileDropZone from '$lib/common/FileDropZone.svelte';
    import KnowledgeDocumentGallery from './knowledge-document-gallery.svelte';
	import { knowledgeBaseDocumentStore } from '$lib/helpers/store';

    const accept = ".txt";
    const acceptDisplayList = "txt";
    const fileMaxSize = 10 * 1024 * 1024;
    const fileUpperLimit = 3;

    /** @type {string} */
    export let collection;

    export let disabled = false;

    /** @type {boolean} */
    let showDocList = false;
    let disableFileDrop = false;

    /** @type {number} */
    let localFileUploadLimit = 0;

    /** @type {any[]} */
    let files = [];

    $: {
        disableFileDrop = disabled || files.length >= fileUpperLimit;
        localFileUploadLimit = Math.max(fileUpperLimit - files.length, 0);
    }

    const unsubscribe = knowledgeBaseDocumentStore.subscribe(value => {
        const savedAttachments = $knowledgeBaseDocumentStore;
        files = value.accepted_files?.length > 0 ? value.accepted_files : savedAttachments?.accepted_files || [];
    });

    onMount(() => {});

    onDestroy(() => {
        unsubscribe();
    });

    /** @param {any} e */
    async function handleFileDrop(e) {
        const { acceptedFiles } = e.detail;
        const savedAttachments = $knowledgeBaseDocumentStore;
        const newAttachments = [...savedAttachments?.accepted_files || [], ...acceptedFiles];
        knowledgeBaseDocumentStore.put({
            accepted_files: newAttachments
        });
    }

    /** @param {number} index */
    function deleteStageFile(index) {
        files = files?.filter((f, idx) => idx !== index) || [];
        knowledgeBaseDocumentStore.put({
            accepted_files: files
        });
    }

    function handleFileUpload() {
        Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to upload document(s) to knowledgebase"?`,
            icon: 'warning',
            showCancelButton: true,
            cancelButtonText: 'No',
            confirmButtonText: 'Yes',
        }).then(async (result) => {
            if (result.value) {
				
            }
        });
    }

</script>

{#if collection}
<div
    class="knowledge-doc-upload-container"
    in:fly={{ y: -10, duration: 500 }}
    out:fly={{ y: -10, duration: 200 }}
>
    <div class="doc-upload-header text-primary fw-bold">
        <div class="line-align-center">
            <div>{'Upload documents'}</div>
        </div>
        <div class="line-align-center" id="upload-tooltip">
            <i class="bx bx-info-circle" />
        </div>
        <Tooltip target="upload-tooltip" placement="right" class="demo-tooltip-note">
            <ul>
                <li>{`At most ${fileUpperLimit} ${fileUpperLimit > 1 ? 'documents are' : 'document is'} allowed for each upload.`}</li>
                <li>{'Each document cannot exceed 10 MB.'}</li>
                <li>{`Allowed document types: ${acceptDisplayList}`}</li>
            </ul>
        </Tooltip>
    </div>
    <div class="doc-upload-body">
        <div class="doc-grid-item">
            <FileDropZone
                accept={accept}
                containerClasses={'doc-drop-zone'}
                disabled={disableFileDrop}
                fileLimit={localFileUploadLimit}
                maxSize={fileMaxSize}
                on:drop={e => handleFileDrop(e)}
            >
                <i class="bx bx-cloud-upload" />
            </FileDropZone>
        </div>
        <KnowledgeDocumentGallery
            files={files}
            needDelete
            disabled={disabled}
            onDelete={idx => deleteStageFile(idx)}
        />
        {#if files?.length > 0}
            <div class="doc-upload-btn doc-grid-item">
                <div class="doc-upload-bg">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                     <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <i
                        class="bx bx-up-arrow-alt clickable"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Upload"
                        on:click={() => handleFileUpload()}
                    />
                </div>
            </div>
        {/if}
    </div>
</div>
{/if}