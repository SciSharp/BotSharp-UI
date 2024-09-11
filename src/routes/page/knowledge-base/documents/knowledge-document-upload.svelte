<script>
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { fly } from 'svelte/transition';
	import { Tooltip, Button, Input } from '@sveltestrap/sveltestrap';
    import Swal from 'sweetalert2';
    import FileDropZone from '$lib/common/FileDropZone.svelte';
    import KnowledgeDocumentGallery from './knowledge-document-gallery.svelte';
	import { knowledgeBaseDocumentStore } from '$lib/helpers/store';

    const svelteDispatch = createEventDispatcher();

    const accept = ".txt";
    const acceptDisplayList = "txt";
    const fileMaxSize = 10 * 1024 * 1024;


    /** @type {string} */
    export let collection;

    /** @type {number} */
    export let fileLimit = 3;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {boolean} */
    let showUploader = true;
    let showDocList = false;
    let disableFileDrop = false;

    /** @type {number} */
    let localFileUploadLimit = 0;

    /** @type {any[]} */
    let uploadFiles = [];
    /** @type {any[]} */
    let savedFiles = [];

    $: {
        disableFileDrop = disabled || uploadFiles.length >= fileLimit;
        localFileUploadLimit = Math.max(fileLimit - uploadFiles.length, 0);
    }
    
    $: {
        if (!showUploader) {
            showDocList = false;
            savedFiles = [];
        }
    }

    const unsubscribe = knowledgeBaseDocumentStore.subscribe(value => {
        const savedAttachments = $knowledgeBaseDocumentStore;
        uploadFiles = value.accepted_files?.length > 0 ? value.accepted_files : savedAttachments?.accepted_files || [];
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
    function deleteUploadFile(index) {
        uploadFiles = uploadFiles?.filter((f, idx) => idx !== index) || [];
        knowledgeBaseDocumentStore.put({
            accepted_files: uploadFiles
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


    function toggleShowDocList() {
        showDocList = !showDocList;
        if (!showDocList) {
            savedFiles = [];
        } else {
            
        }
    }
</script>

{#if collection}
<div
    class="knowledge-doc-upload-container"
    in:fly={{ y: -10, duration: 500 }}
    out:fly={{ y: -10, duration: 200 }}
>
    <div class="doc-upload-header text-primary fw-bold">
        <Input
            type="switch"
            class="upload-toggle-btn"
            bind:checked={showUploader}
        />
        <div class="line-align-center">
            <div>{'View Documents'}</div>
        </div>
        {#if showUploader}
            <div class="line-align-center" id="upload-tooltip">
                <i class="bx bx-info-circle" />
            </div>
            <Tooltip target="upload-tooltip" placement="right" class="demo-tooltip-note">
                <ul>
                    <li>{`At most ${fileLimit} ${fileLimit > 1 ? 'documents are' : 'document is'} allowed for each upload.`}</li>
                    <li>{'Each document cannot exceed 10 MB.'}</li>
                    <li>{`Allowed document types: ${acceptDisplayList}`}</li>
                </ul>
            </Tooltip>
        {/if}
    </div>
    {#if showUploader}
        <div
            in:fly={{ y: -10, duration: 500 }}
            out:fly={{ y: -10, duration: 200 }}
        >
            <div class="doc-upload-body doc-gallery-container">
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
                    files={uploadFiles}
                    showFileName
                    needDelete
                    disabled={disabled}
                    onDelete={idx => deleteUploadFile(idx)}
                />
                {#if uploadFiles?.length > 0}
                    <div class="doc-upload-btn doc-grid-item">
                        <div class="doc-upload-bg">
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <i
                                class="mdi mdi-arrow-up-bold-circle clickable"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="Upload"
                                on:click={() => handleFileUpload()}
                            />
                        </div>
                    </div>
                {/if}
            </div>
            <div class="doc-upload-footer">
                <div class="load-doc-btn">
                    <Button
                        class={`btn btn-md knowledge-demo-btn ${showDocList ? 'btn-soft-warning' : 'btn-soft-primary'}`}
                        on:click={() => toggleShowDocList()}
                    >
                        {#if !showDocList}
                            <div class="btn-content">
                                <div class="knowledge-btn-icon line-align-center"><i class="bx bx-search-alt" /></div>
                                <div>{'Load Collection Documents'}</div>
                            </div>
                        {:else}
                            <div class="btn-content">
                                <div class="knowledge-btn-icon"><i class="bx bx-hide" /></div>
                                <div>{'Hide Collection Documents'}</div>
                            </div>
                        {/if}
                    </Button>
                </div>
                {#if savedFiles.length > 0}
                    <div
                        class="collection-docs doc-gallery-container"
                        in:fly={{ y: -10, duration: 500 }}
                        out:fly={{ y: -10, duration: 200 }}
                    >
                        <KnowledgeDocumentGallery
                            files={savedFiles}
                            showFileName
                            needDelete
                            disabled={disabled}
                        />
                    </div>
                {:else if showDocList && savedFiles.length === 0}
                    <div
                        class="mt-4"
                        in:fly={{ y: -10, duration: 500 }}
                        out:fly={{ y: -10, duration: 200 }}
                    >
                        <h4 class="text-secondary">{"Ehhh, nothing is found..."}</h4>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>
{/if}