<script>
    import PlainModal from '$lib/common/modals/PlainModal.svelte';
    import Select from "$lib/common/dropdowns/Select.svelte";
    import FileDropZone from '$lib/common/files/FileDropZone.svelte';
    import FileGallery from '$lib/common/files/FileGallery.svelte';
	import { uploadKnowledgeFiles } from "$lib/services/knowledge-base-service";
	import { KnowledgeDocSource } from "$lib/helpers/enums";
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';

    const duration = 3000;

    /**
     * @type {{
     *   collection: string,
     *   open?: boolean,
     *   disabled?: boolean,
     *   className?: string,
     *   size?: string,
     *   accept?: string,
     *   processors: import('$commonTypes').LabelValuePair[],
     *   fileMaxSize?: number,
     *   toggleModal?: () => void,
     *   ondocuploaded?: () => void
     * }}
     */
    let {
        collection,
        open = false,
        disabled = $bindable(false),
        className = "",
        size = 'md',
        accept = ".txt",
        processors,
        fileMaxSize = 10,
        toggleModal = () => {},
        ondocuploaded = () => {}
    } = $props();

    /** @type {boolean} */
    let isLoading = $state(false);
    let isComplete = $state(false);
    let isError = $state(false);

    /** @type {string | null} */
    let selectedProcessor = $state(null);
    let successText = $state('Knowledge has been uploaded!');
    let errorText = $state('Error when uploading knowledge!');

    /** @param {any} e */
    function changeProcessor(e) {
        selectedProcessor = e?.detail?.selecteds[0]?.value || null;
    }

    /** @param {any} e */
    function handleFileDrop(e) {
        const { acceptedFiles } = e;

        if (!acceptedFiles
            || acceptedFiles.length === 0
            || !selectedProcessor
        ) {
            return;
        }

        // @ts-ignore
        const files = acceptedFiles.map(x => {
            return {
                file_name: x.file_name,
                file_data: x.file_data,
                file_source: KnowledgeDocSource.User
            };
        });

        isLoading = true;
        disabled = true;
        toggleModal?.();

        uploadKnowledgeFiles(collection,
        {
            files: files,
            options: {
                processor: selectedProcessor
            }
        }).then(res => {
            if (res.failed?.length > 0) {
                isError = true;
                setTimeout(() => {
                    isError = false;
                }, duration);
            } else {
                isComplete = true;
                setTimeout(() => {
                    isComplete = false;
                }, duration);
            }
            ondocuploaded();
        }).catch((err) => {
            console.log('Upload document error:', err);
            isError = true;
            setTimeout(() => {
                isError = false;
            }, duration);
        }).finally(() => {
            disabled = false;
            isLoading = false;
        });
    }
</script>

<LoadingToComplete
    spinnerStyles={'position: fixed;'}
    {isLoading}
    {isComplete}
    {isError}
    {successText}
    {errorText}
/>

<PlainModal
    isOpen={open}
    {size}
    containerClasses={className}
    toggleModal={() => toggleModal?.()}
>
    <div>
        <div class="kum-collection-row">
            <span class="kum-collection-label">{'Collection: '}</span>
            <span class="kum-collection-value">{collection}</span>
        </div>
        <form>
            <div class="kum-field">
                <div class="kum-field-label-row">
                    <div class="kum-field-label">{'Document Processor'}</div>
                </div>
                <Select
                    tag={'kn-doc-processor-select'}
                    placeholder={'Select Processor'}
                    searchMode
                    selectedValues={selectedProcessor ? [selectedProcessor] : []}
                    options={processors}
                    onselect={e => changeProcessor(e)}
                />
            </div>
            <div class="kum-field">
                <FileGallery
                    containerClasses={'kum-gallery'}
                    showPrefix={true}
                    disabled={disabled || !selectedProcessor}
                >
                    {#snippet prefix()}
                        <FileDropZone
                            accept={accept}
                            containerClasses={'kum-drop-zone'}
                            disabled={!selectedProcessor}
                            fileLimit={1}
                            maxSize={fileMaxSize * 1024 * 1024}
                            ondrop={handleFileDrop}
                        >
                            <div class="kum-drop-content">
                                <div class="kum-drop-icon">
                                    <i class="bx bx-cloud-upload"></i>
                                </div>
                                <div>
                                    <ul class="kum-drop-list">
                                        <li>{'Please select a processor before uploading.'}</li>
                                        <li>{'File cannot exceed 10 MB.'}</li>
                                        <li>{`File types allowed: ${accept?.split(',')?.join(', ') || 'none'}`}</li>
                                    </ul>
                                </div>
                            </div>
                        </FileDropZone>
                    {/snippet}
                </FileGallery>
            </div>
        </form>
    </div>
</PlainModal>

<style>
    /* ===== Collection label row ===== */
    .kum-collection-row {
        margin-bottom: 1rem;
        font-size: 0.875rem;
    }
    .kum-collection-label {
        font-weight: 700;
        color: rgb(55 65 81);
    }
    .kum-collection-value {
        font-size: 0.9375rem;
        color: var(--color-primary);
    }

    /* ===== Form fields ===== */
    .kum-field {
        margin-top: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .kum-field-label-row {
        display: flex;
        gap: 0.25rem;
    }
    .kum-field-label {
        font-weight: 700;
        font-size: 0.875rem;
        color: rgb(55 65 81);
    }

    /* ===== Drop zone content (inside FileDropZone) ===== */
    :global(.kum-gallery) {
        width: 100%;
        min-height: 200px;
    }
    :global(.kum-gallery .kum-drop-zone) {
        width: 100%;
        min-height: 200px;
    }
    .kum-drop-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
    }
    .kum-drop-icon {
        text-align: center;
        font-size: 5em;
        line-height: 1;
        color: var(--color-primary);
    }
    .kum-drop-list {
        margin: 0;
        padding-left: 1.25rem;
        font-size: 0.8125rem;
        color: var(--color-muted);
        list-style: disc;
    }
    .kum-drop-list li {
        margin: 0.25rem 0;
    }

    /* ===== Dark mode ===== */
    :global(.dark) .kum-collection-label,
    :global(.dark) .kum-field-label {
        color: rgb(229 231 235);
    }
</style>