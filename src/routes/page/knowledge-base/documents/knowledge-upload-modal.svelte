<script>
    import { createEventDispatcher } from 'svelte';
    import {
        Form,
        Modal,
        ModalBody,
        ModalHeader
    } from "@sveltestrap/sveltestrap";
    import Select from "$lib/common/Select.svelte";
    import FileDropZone from '$lib/common/FileDropZone.svelte';
    import FileGallery from '$lib/common/FileGallery.svelte';
	import { uploadKnowledgeDocuments } from "$lib/services/knowledge-base-service";
	import { KnowledgeDocSource } from "$lib/helpers/enums";
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';

    const svelteDispatch = createEventDispatcher();

    const duration = 3000;

    /** @type {string} */
    export let collection;

    /** @type {boolean} */
    export let open = false;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {string} */
    export let className = "";

    /** @type {string} */
    export let size = 'md';

    /** @type {string} */
    export let accept = ".txt";

    /** @type {import('$commonTypes').LabelValuePair[]} */
    export let processors;

    /** @type {number} MB */
    export let fileMaxSize = 10;

    /** @type {() => void} */
    export let toggleModal;


    /** @type {boolean} */
    let isLoading = false;
    let isComplete = false;
    let isError = false;

    /** @type {string | null} */
    let selectedProcessor = null;
    let successText = 'Knowledge has been uploaded!';
    let errorText = 'Error when uploading knowledge!';

    /** @param {any} e */
    function changeProcessor(e) {
        selectedProcessor = e?.detail?.selecteds[0]?.value || null;
    }

    /** @param {any} e */
    function handleFileDrop(e) {
        const { acceptedFiles } = e.detail;

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

        uploadKnowledgeDocuments(collection,
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
            svelteDispatch("docuploaded");
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

<Modal
    class={className}
    fade
    size={size}
    isOpen={open}
    toggle={() => toggleModal?.()}
    unmountOnClose
>
    <ModalHeader toggle={() => toggleModal?.()}>
        <div>
            <span class="fw-bold">{'Collection: '}</span>
            <span class="text-primary collection-value">{collection}</span>
        </div>
    </ModalHeader>
    <ModalBody>
        <Form>
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
                    on:select={e => changeProcessor(e)}
                />
            </div>
            <div class="mt-2 d-flex flex-column gap-2">
                <FileGallery
                    containerClasses={'doc-upload-body'}
                    showPrefix={true}
                    disabled={disabled || !selectedProcessor}
                >
                    <FileDropZone
                        slot="prefix"
                        accept={accept}
                        containerClasses={'doc-drop-zone'}
                        disabled={!selectedProcessor}
                        fileLimit={1}
                        maxSize={fileMaxSize * 1024 * 1024}
                        on:drop={e => handleFileDrop(e)}
                    >
                        <div>
                            <div class="doc-drop-icon">
                                <i class="bx bx-cloud-upload" />
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
                </FileGallery>
            </div>
        </Form>
    </ModalBody>
</Modal>