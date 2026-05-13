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
        <div class="mb-3">
            <span class="fw-bold">{'Collection: '}</span>
            <span class="text-primary collection-value">{collection}</span>
        </div>
        <form>
            <div class="mt-2 d-flex flex-column gap-2">
                <div class="d-flex gap-1">
                    <div class="fw-bold">{'Document Processor'}</div>
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
            <div class="mt-2 d-flex flex-column gap-2">
                <FileGallery
                    containerClasses={'doc-upload-body'}
                    showPrefix={true}
                    disabled={disabled || !selectedProcessor}
                >
                    {#snippet prefix()}
                        <FileDropZone
                            accept={accept}
                            containerClasses={'doc-drop-zone'}
                            disabled={!selectedProcessor}
                            fileLimit={1}
                            maxSize={fileMaxSize * 1024 * 1024}
                            ondrop={handleFileDrop}
                        >
                            <div>
                                <div class="doc-drop-icon">
                                    <i class="bx bx-cloud-upload"></i>
                                </div>
                                <div>
                                    <ul>
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