<script>
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { fly } from 'svelte/transition';
	import { Tooltip, Button, Input } from '@sveltestrap/sveltestrap';
    import { PUBLIC_SERVICE_URL } from '$env/static/public';
    import Swal from 'sweetalert2';
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
    import FileDropZone from '$lib/common/files/FileDropZone.svelte';
    import FileGallery from '$lib/common/files/FileGallery.svelte';
    import LoadingDots from '$lib/common/spinners/LoadingDots.svelte';
    import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
    import { isExternalUrl } from '$lib/helpers/utils/common';
	import { knowledgeBaseDocumentStore, userStore } from '$lib/helpers/store';
    import { KnowledgeDocSource } from '$lib/helpers/enums';
    import { isHtml } from '$lib/helpers/utils/file';
	import {
        getKnowledgeDocumentPageList,
        uploadKnowledgeDocuments,
        deleteKnowledgeDocument,
        deleteAllKnowledgeDocuments
    } from '$lib/services/knowledge-base-service';
    import KnowledgeUploadResult from './knowledge-upload-result.svelte';

    const svelteDispatch = createEventDispatcher();

    const startPage = 1;
    const docPageSize = 8;
    const defaultProcessor = 'botsharp-txt-knowledge';

    const options = {
		scrollbars: {
			visibility: 'auto',
			autoHide: 'move',
			autoHideDelay: 100,
			dragScroll: true,
			clickScroll: false,
			theme: 'os-theme-dark',
			pointers: ['mouse', 'touch', 'pen']
		}
	};

    /** @type {string} */
    export let collection;

    /** @type {number} */
    export let fileLimit = 3;

    /** @type {boolean} */
    export let showDocList = false;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {boolean} */
    export let disableFileUpload = false;

    /** @type {boolean} */
    export let disableFileDelete = false;

    /** @type {string} */
    export let accept = ".txt,.pdf";

    /** @type {number} mb */
    export let fileMaxSize = 10;

    /** @type {() => void} */
    export const onCollectionChanged = () => {
        showDocList = false;
        savedFiles = [];
        reset();
    };

    /** @type {boolean} */
    let showUploader = false;
    let disableFileDrop = false;
    let isLoading = false;
    let isLoadingFiles = false;
    let noMoreDocs = false;

    /** @type {number} */
    let localFileUploadLimit = 0;
    let docPage = startPage;

    /** @type {any[]} */
    let uploadFiles = [];
    /** @type {any[]} */
    let savedFiles = [];
    /** @type {string[]} */
    let successFiles = [];
    /** @type {string[]} */
    let failedFiles = [];

    $: {
        disableFileDrop = uploadFiles.length >= fileLimit;
        localFileUploadLimit = Math.max(fileLimit - uploadFiles.length, 0);
    }

    $: {
        if (!showDocList) {
            docPage = startPage;
            savedFiles = [];
            noMoreDocs = false;
        }
    }

    const unsubscribe = knowledgeBaseDocumentStore.subscribe(value => {
        const savedAttachments = $knowledgeBaseDocumentStore;
        uploadFiles = value.accepted_files?.length > 0 ? value.accepted_files : savedAttachments?.accepted_files || [];
    });

    onMount(() => {
        init();
    });

    onDestroy(() => {
        unsubscribe();
    });

    function init() {
        showUploader = false;
    }

    /** @param {any} e */
    function toggleUploader(e) {
        showUploader = e.target.checked;
        if (!showUploader) {
            showDocList = false;
            savedFiles = [];
            reset();
        }
    }

    /** @param {any} e */
    function handleFileDrop(e) {
        reset();
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

    function handleFileSubmit() {
        Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to submit ${uploadFiles.length > 1 ? 'these documents' : 'this document'} to knowledgebase"?`,
            icon: 'warning',
            showCancelButton: true,
            cancelButtonText: 'No',
            confirmButtonText: 'Yes',
        }).then(async (result) => {
            if (result.value) {
                const files = uploadFiles.map(x => {
                    return {
                        file_name: x.file_name,
                        file_data: x.file_data,
                        file_source: KnowledgeDocSource.User
                    };
                });

                disabled = true;
                isLoading = true;
				uploadKnowledgeDocuments(collection,
                {
                    files: files,
                    options: {
                        processor: defaultProcessor
                    }
                }).then(res => {
                    successFiles = res.success || [];
                    failedFiles = res.failed || [];
                    uploadFiles = [];
                    knowledgeBaseDocumentStore.reset();
                    svelteDispatch("docuploaded");

                    if (showDocList) {
                        docPage = startPage;
                        getKnowledgeDocumentList();
                    }
                }).catch(() => {
                    successFiles = [];
                    failedFiles = files.map(x => x.file_name);
                }).finally(() => {
                    disabled = false;
                    isLoading = false;
                });
            }
        });
    }

    function toggleShowDocList() {
        showDocList = !showDocList;
        if (showDocList) {
            getKnowledgeDocumentList();
        }
    }

    function loadMoreDocs() {
        if (isLoadingFiles) return;
        
        getKnowledgeDocumentList().then(() => {
            autoScrollToBottom();
        });
    }

    function getKnowledgeDocumentList() {
        isLoadingFiles = true;
        disabled = true;
        noMoreDocs = false;

        const page = docPage;
        return new Promise((resolve, reject) => {
            getKnowledgeDocumentPageList(
                collection,
                { page: page, size: docPageSize }
            ).then(res => {
                const items = res?.items || [];
                if (items.length > 0) {
                    docPage += 1;
                    if (page === startPage) {
                        savedFiles = [...items];
                    } else {
                        const files = [...savedFiles, ...items];
                        savedFiles = unique(files);
                    }
                } else {
                    noMoreDocs = true;
                }
                disabled = false;
                resolve(res);
            }).catch(err => {
                disabled = false;
                reject(err);
            }).finally(() => {
                isLoadingFiles = false;
            });
        });
        
    }

    /** @param {number} index */
    function handleDeleteSavedFile(index) {
        const found = savedFiles.find((_, idx) => idx === index);

        Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to delete "${found.file_name}" and its knowledge"?`,
            icon: 'warning',
            customClass: { confirmButton: 'danger-background' },
            showCancelButton: true,
            cancelButtonText: 'No',
            confirmButtonText: 'Yes',
        }).then(async (result) => {
            if (result.value) {
                disabled = true;
                deleteKnowledgeDocument(collection, found.file_id).then(res => {
                    if (res) {
                        savedFiles = savedFiles.filter((_, idx) => idx !== index);
                        docPage = startPage;
                        getKnowledgeDocumentList();
                    }
                    svelteDispatch("docdeleted", { success: res });
                }).catch(err => {
                    svelteDispatch("docdeleted", { success: false });
                }).finally(() => {
                    disabled = false;
                    reset();
                });
            }
        });
    }

    function handleDeleteAllSavedFiles() {
        if (disabled || savedFiles.length === 0) return;

        Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to delete all the documents and their knowledge"?`,
            icon: 'warning',
            customClass: { confirmButton: 'danger-background' },
            showCancelButton: true,
            cancelButtonText: 'No',
            confirmButtonText: 'Yes',
        }).then(async (result) => {
            if (result.value) {
                disabled = true;
                deleteAllKnowledgeDocuments(collection, { page: 1, size: 10 }).then(res => {
                    if (res) {
                        savedFiles = [];
                        docPage = startPage;
                        getKnowledgeDocumentList();
                    }
                    svelteDispatch("resetdocs", { success: res });
                }).catch(err => {
                    svelteDispatch("resetdocs", { success: false });
                }).finally(() => {
                    disabled = false;
                });
            }
        });
    }

    /** @param {number} index */
    function handleDownloadSavedFile(index) {
        const found = savedFiles.find((_, idx) => idx === index);
        if (!found) return;

        let url = '';
        if (!isHtml(found.file_extension || found.file_name)) {
            if (found.file_url) {
                url = isExternalUrl(found.file_url) ? found.file_url : `${PUBLIC_SERVICE_URL}${found.file_url}?access_token=${$userStore?.token}`;
            }
        } else {
            url = found.ref_data?.url;
        }

        if (url) {
            window.open(url);
        }
    }

    function reset() {
        successFiles = [];
        failedFiles = [];
    }

    function autoScrollToBottom() {
        const elem = document.querySelector('.docs-scrollbar');
        // @ts-ignore
        const scrollbar = OverlayScrollbars(elem, options);
		if (scrollbar) {
            setTimeout(() => {
				const { viewport } = scrollbar.elements();
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
			}, 200);
        }
	}

    /** @param {any[]} files */
    function unique(files) {
        if (!files) return [];

        const map = new Map();
        return files.filter(x => !map.has(x.file_id) && map.set(x.file_id, 1));
    }
</script>

<LoadingToComplete {isLoading} />

<div
    class="knowledge-doc-upload-container"
    in:fly={{ y: -10, duration: 500 }}
    out:fly={{ y: -10, duration: 200 }}
>
    <div class="doc-upload-header text-primary fw-bold">
        <Input
            type="switch"
            class="upload-toggle-btn"
            disabled={disabled}
            checked={showUploader}
            on:change={e => toggleUploader(e)}
        />
        <div class="line-align-center">
            <div>{`${showUploader && !disableFileUpload ? 'Upload' : 'View'} Documents`}</div>
        </div>
        {#if showUploader}
            <div class="line-align-center" id="upload-tooltip">
                <i class="bx bx-info-circle" />
            </div>
            <Tooltip target="upload-tooltip" placement="top" class="demo-tooltip-note">
                <ul>
                    <li>{`At most ${fileLimit} ${fileLimit > 1 ? 'documents are' : 'document is'} allowed for each upload.`}</li>
                    <li>{`Each document cannot exceed ${fileMaxSize} MB.`}</li>
                    <li>{`Document types allowed: ${accept?.split(',')?.join(', ') || 'none'}`}</li>
                </ul>
            </Tooltip>
        {/if}
    </div>
    {#if showUploader}
        <div
            class="doc-uploader-container mt-3"
            in:fly={{ y: -10, duration: 500 }}
            out:fly={{ y: -10, duration: 200 }}
        >
            {#if !disableFileUpload}
                <FileGallery
                    containerClasses={'doc-upload-body'}
                    files={uploadFiles}
                    showFileName
                    needDelete
                    disabled={disabled}
                    onDelete={idx => deleteUploadFile(idx)}
                    showPrefix={true}
                    showSuffix={uploadFiles?.length > 0}
                >
                    <FileDropZone
                        slot="prefix"
                        accept={accept}
                        containerClasses={'doc-drop-zone'}
                        disabled={disabled || disableFileDrop}
                        fileLimit={localFileUploadLimit}
                        maxSize={fileMaxSize * 1024 * 1024}
                        on:drop={e => handleFileDrop(e)}
                    >
                        <i class="bx bx-cloud-upload" />
                    </FileDropZone>
                    <div
                        slot="suffix"
                        class="doc-card-btn"
                    >
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <i
                            class="mdi mdi-arrow-up-bold-circle clickable"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Submit"
                            on:click={() => handleFileSubmit()}
                        />
                    </div>
                </FileGallery>
            {/if}

            <KnowledgeUploadResult
                successFiles={successFiles}
                failedFiles={failedFiles}
            />

            <div class="doc-upload-footer" style={`margin-top: ${!disableFileUpload ? '30px;' : '0px;'}`}>
                <div class="load-doc-btn">
                    <Button
                        class={`btn btn-md knowledge-demo-btn ${showDocList ? 'btn-soft-warning' : 'btn-soft-primary'}`}
                        disabled={disabled}
                        on:click={() => toggleShowDocList()}
                    >
                        {#if !showDocList}
                            <div class="btn-content">
                                <div class="knowledge-btn-icon line-align-center"><i class="bx bx-search-alt" /></div>
                                <div>{'View Collection Documents'}</div>
                            </div>
                        {:else}
                            <div class="btn-content">
                                <div class="knowledge-btn-icon"><i class="bx bx-hide" /></div>
                                <div>{'Hide Collection Documents'}</div>
                            </div>
                        {/if}
                    </Button>
                    {#if showDocList && !disableFileDelete}
                        <div class="reset-docs-btn line-align-center">
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <i
                                class={`bx bx-trash ${disabled || savedFiles.length === 0 ? '' : 'clickable'}`}
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="Delete all docs"
                                on:click={() => handleDeleteAllSavedFiles()}
                            />
                        </div>
                    {/if}
                </div>
                {#if showDocList}
                    <div class="collection-docs docs-scrollbar">
                        <div>
                            {#if savedFiles.length > 0}
                                <FileGallery
                                    files={savedFiles}
                                    showFileName
                                    disabled={disabled}
                                    needDelete={!disableFileDelete}
                                    onDelete={idx => handleDeleteSavedFile(idx)}
                                    needDownload
                                    onDownload={idx => handleDownloadSavedFile(idx)}
                                    showSuffix={!noMoreDocs}
                                >
                                    <div class="doc-card-btn doc-load-more" slot="suffix">
                                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                                        <i
                                            class="mdi mdi-eye-plus-outline clickable"
                                            data-bs-toggle="tooltip"
                                            data-bs-placement="top"
                                            title="Load more"
                                            on:click={() => loadMoreDocs()}
                                        />
                                    </div>
                                </FileGallery>
                            {:else if !isLoadingFiles && savedFiles.length === 0}
                                <div class="mt-3 text-center">
                                    <h4 class="text-secondary">{"Ehhh, nothing is found..."}</h4>
                                </div>
                            {/if}
                            {#if isLoadingFiles}
                                <div class="knowledge-loader mt-3 mb-3">
                                    <LoadingDots duration={'1s'} size={12} gap={5} color={'var(--bs-primary)'} />
                                </div>
                            {:else if noMoreDocs && savedFiles.length > 0}
                                <div class="mt-3 text-center">
                                    <h4 class="text-secondary">{"No more files..."}</h4>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>