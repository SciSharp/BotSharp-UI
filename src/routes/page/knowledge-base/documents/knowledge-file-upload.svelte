<script>
    import { onMount, onDestroy } from 'svelte';
    import { fly } from 'svelte/transition';
    import { PUBLIC_SERVICE_URL } from '$env/static/public';
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
    import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
    import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';
    import FileDropZone from '$lib/common/files/FileDropZone.svelte';
    import FileGallery from '$lib/common/files/FileGallery.svelte';
    import LoadingDots from '$lib/common/spinners/LoadingDots.svelte';
    import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
    import { isExternalUrl } from '$lib/helpers/utils/common';
	import { knowledgeBaseDocumentStore, userStore } from '$lib/helpers/store';
    import { KnowledgeDocSource } from '$lib/helpers/enums';
    import { isHtml } from '$lib/helpers/utils/file';
	import {
        getKnowledgeFilePageList,
        uploadKnowledgeFiles,
        deleteKnowledgeFile,
        deleteAllKnowledgeFiles
    } from '$lib/services/knowledge-base-service';
    import KnowledgeUploadResult from './knowledge-upload-result.svelte';

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

    /**
     * @type {{
     *   collection: string,
     *   fileLimit?: number,
     *   showDocList?: boolean,
     *   disabled?: boolean,
     *   disableFileUpload?: boolean,
     *   disableFileDelete?: boolean,
     *   accept?: string,
     *   fileMaxSize?: number,
     *   onCollectionChanged?: () => void,
     *   ondocuploaded?: () => void,
     *   ondocdeleted?: (detail: { success: boolean }) => void,
     *   onresetdocs?: (detail: { success: boolean }) => void
     * }}
     */
    let {
        collection,
        fileLimit = 3,
        showDocList = $bindable(false),
        disabled = $bindable(false),
        disableFileUpload = false,
        disableFileDelete = false,
        accept = ".txt,.pdf",
        fileMaxSize = 10,
        ondocuploaded = () => {},
        ondocdeleted = (/** @type {{ success: boolean }} */ _detail) => {},
        onresetdocs = (/** @type {{ success: boolean }} */ _detail) => {}
    } = $props();

    /**
     * Called when collection changes from parent.
     * Exposed via bind:this on the component.
     */
    export function handleCollectionChanged() {
        showDocList = false;
        savedFiles = [];
        reset();
    }

    /** @type {boolean} */
    let showUploader = $state(false);
    let isLoading = $state(false);
    let isLoadingFiles = $state(false);
    let noMoreDocs = $state(false);

    let docPage = $state(startPage);

    /** @type {any[]} */
    let uploadFiles = $state([]);
    /** @type {any[]} */
    let savedFiles = $state([]);
    /** @type {string[]} */
    let successFiles = $state([]);
    /** @type {string[]} */
    let failedFiles = $state([]);

    let disableFileDrop = $derived(uploadFiles.length >= fileLimit);
    let localFileUploadLimit = $derived(Math.max(fileLimit - uploadFiles.length, 0));

    $effect(() => {
        if (!showDocList) {
            docPage = startPage;
            savedFiles = [];
            noMoreDocs = false;
        }
    });

    const unsubscribe = knowledgeBaseDocumentStore.subscribe(value => {
        const savedAttachments = /** @type {any} */ (knowledgeBaseDocumentStore).get?.() || {};
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
        const { acceptedFiles } = e;
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

    /**
     * @typedef {{ kind: 'submit' }
     *   | { kind: 'delete-file', index: number, fileName: string }
     *   | { kind: 'delete-all' }} PendingAction
     */

    let confirmOpen = $state(false);
    /** @type {PendingAction | null} */
    let pendingAction = $state(null);

    function closeConfirm() {
        confirmOpen = false;
        pendingAction = null;
    }

    function onConfirm() {
        if (!pendingAction) {
            closeConfirm();
            return;
        }
        const action = pendingAction;
        closeConfirm();
        if (action.kind === 'submit') {
            handleSubmitUpload();
        } else if (action.kind === 'delete-file') {
            handleDeleteFile(action.index);
        } else {
            handleDeleteAllFiles();
        }
    }

    function handleFileSubmit() {
        pendingAction = { kind: 'submit' };
        confirmOpen = true;
    }

    function handleSubmitUpload() {
        const files = uploadFiles.map(x => {
            return {
                file_name: x.file_name,
                file_data: x.file_data,
                file_source: KnowledgeDocSource.User
            };
        });

        disabled = true;
        isLoading = true;
        uploadKnowledgeFiles(collection,
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
            ondocuploaded();

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
            getKnowledgeFilePageList(
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
        if (!found) return;
        pendingAction = { kind: 'delete-file', index, fileName: found.file_name };
        confirmOpen = true;
    }

    /** @param {number} index */
    function handleDeleteFile(index) {
        const found = savedFiles.find((_, idx) => idx === index);
        if (!found) return;
        disabled = true;
        deleteKnowledgeFile(collection, found.file_id).then(res => {
            if (res) {
                savedFiles = savedFiles.filter((_, idx) => idx !== index);
                docPage = startPage;
                getKnowledgeDocumentList();
            }
            ondocdeleted({ success: res });
        }).catch(() => {
            ondocdeleted({ success: false });
        }).finally(() => {
            disabled = false;
            reset();
        });
    }

    function handleDeleteAllSavedFiles() {
        if (disabled || savedFiles.length === 0) return;
        pendingAction = { kind: 'delete-all' };
        confirmOpen = true;
    }

    function handleDeleteAllFiles() {
        disabled = true;
        deleteAllKnowledgeFiles(collection, { page: 1, size: 10 }).then(res => {
            if (res) {
                savedFiles = [];
                docPage = startPage;
                getKnowledgeDocumentList();
            }
            onresetdocs({ success: res });
        }).catch(() => {
            onresetdocs({ success: false });
        }).finally(() => {
            disabled = false;
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

<ConfirmModal
    isOpen={confirmOpen}
    icon="warning"
    title="Are you sure?"
    text={pendingAction?.kind === 'submit'
        ? `Are you sure you want to submit ${uploadFiles.length > 1 ? 'these documents' : 'this document'} to knowledgebase?`
        : pendingAction?.kind === 'delete-file'
            ? `Are you sure you want to delete "${pendingAction.fileName}" and its knowledge?`
            : 'Are you sure you want to delete all the documents and their knowledge?'}
    confirmBtnText="Yes"
    cancelBtnText="No"
    confirmBtnColor={pendingAction?.kind === 'submit' ? 'primary' : 'danger'}
    confirm={onConfirm}
    cancel={closeConfirm}
    toggleModal={closeConfirm}
/>

<div
    class="doc-up-container"
    in:fly={{ y: -10, duration: 500 }}
    out:fly={{ y: -10, duration: 200 }}
>
    <div class="doc-up-header">
        <label class="doc-up-switch">
            <input
                type="checkbox"
                role="switch"
                disabled={disabled}
                checked={showUploader}
                onchange={e => toggleUploader(e)}
            />
            <span class="doc-up-switch-slider"></span>
        </label>
        <div class="doc-up-header-label">
            <div>{`${showUploader && !disableFileUpload ? 'Upload' : 'View'} Documents`}</div>
        </div>
        {#if showUploader}
            <div class="doc-up-tooltip-icon" id="upload-tooltip">
                <i class="bx bx-info-circle"></i>
            </div>
            <BotsharpTooltip target="upload-tooltip" placement="top" containerClasses="[&_.tooltip-inner]:max-w-fit">
                <ul class="mb-0 list-disc pl-4 text-left">
                    <li class="my-[3px]">{`At most ${fileLimit} ${fileLimit > 1 ? 'documents are' : 'document is'} allowed for each upload.`}</li>
                    <li class="my-[3px]">{`Each document cannot exceed ${fileMaxSize} MB.`}</li>
                    <li class="my-[3px]">{`Document types allowed: ${accept?.split(',')?.join(', ') || 'none'}`}</li>
                </ul>
            </BotsharpTooltip>
        {/if}
    </div>
    {#if showUploader}
        <div
            class="doc-up-uploader"
            in:fly={{ y: -10, duration: 500 }}
            out:fly={{ y: -10, duration: 200 }}
        >
            {#if !disableFileUpload}
                <FileGallery
                    containerClasses={'doc-up-gallery'}
                    files={uploadFiles}
                    showFileName
                    needDelete
                    disabled={disabled}
                    onDelete={idx => deleteUploadFile(idx)}
                    showPrefix={true}
                    showSuffix={uploadFiles?.length > 0}
                >
                    {#snippet prefix()}
                        <FileDropZone
                            accept={accept}
                            containerClasses={'doc-up-drop-zone'}
                            disabled={disabled || disableFileDrop}
                            fileLimit={localFileUploadLimit}
                            maxSize={fileMaxSize * 1024 * 1024}
                            ondrop={handleFileDrop}
                        >
                            <i class="bx bx-cloud-upload"></i>
                        </FileDropZone>
                    {/snippet}
                    {#snippet suffix()}
                        <div class="doc-up-card-btn">
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <i
                                class="mdi mdi-arrow-up-bold-circle doc-up-clickable"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="Submit"
                                onclick={() => handleFileSubmit()}
                            ></i>
                        </div>
                    {/snippet}
                </FileGallery>
            {/if}

            <KnowledgeUploadResult
                successFiles={successFiles}
                failedFiles={failedFiles}
            />

            <div class="doc-up-footer" class:doc-up-footer-compact={disableFileUpload}>
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <div class="doc-up-load-doc-row">
                    <button
                        type="button"
                        class={`doc-up-btn ${showDocList ? 'doc-up-btn-warning' : 'doc-up-btn-primary'}`}
                        disabled={disabled}
                        onclick={() => toggleShowDocList()}
                    >
                        {#if !showDocList}
                            <i class="bx bx-search-alt"></i>
                            <span>{'View Collection Documents'}</span>
                        {:else}
                            <i class="bx bx-hide"></i>
                            <span>{'Hide Collection Documents'}</span>
                        {/if}
                    </button>
                    {#if showDocList && !disableFileDelete}
                        <div class="doc-up-reset-docs">
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <i
                                class={`bx bx-trash ${disabled || savedFiles.length === 0 ? '' : 'doc-up-clickable'}`}
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="Delete all docs"
                                onclick={() => handleDeleteAllSavedFiles()}
                            ></i>
                        </div>
                    {/if}
                </div>
                {#if showDocList}
                    <div class="doc-up-collection-docs">
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
                                    {#snippet suffix()}
                                        <div class="doc-up-card-btn doc-up-load-more">
                                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                                            <i
                                                class="mdi mdi-eye-plus-outline doc-up-clickable"
                                                data-bs-toggle="tooltip"
                                                data-bs-placement="top"
                                                title="Load more"
                                                onclick={() => loadMoreDocs()}
                                            ></i>
                                        </div>
                                    {/snippet}
                                </FileGallery>
                            {:else if !isLoadingFiles && savedFiles.length === 0}
                                <div class="doc-up-empty">
                                    <h4>{"Ehhh, nothing is found..."}</h4>
                                </div>
                            {/if}
                            {#if isLoadingFiles}
                                <div class="doc-up-loader">
                                    <LoadingDots duration={'1s'} size={12} gap={5} color={'var(--color-primary)'} />
                                </div>
                            {:else if noMoreDocs && savedFiles.length > 0}
                                <div class="doc-up-empty">
                                    <h4>{"No more files..."}</h4>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>



