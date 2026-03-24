<script>
    // @ts-nocheck
    import { fromEvent } from "file-selector";
    import {
      allFilesAccepted,
      composeEventHandlers,
      fileAccepted,
      fileMatchSize,
      getBase64,
      isEvtWithFiles,
      isIeOrEdge,
      isPropagationStopped,
      TOO_MANY_FILES_REJECTION
    } from "$lib/helpers/utils/file";
    import { onDestroy } from "svelte";

    /**
     * @type {{
     *   accept?: string,
     *   disabled?: boolean,
     *   getFilesFromEvent?: (event: any) => any,
     *   maxSize?: number,
     *   minSize?: number,
     *   multiple?: boolean,
     *   preventDropOnDocument?: boolean,
     *   noClick?: boolean,
     *   noKeyboard?: boolean,
     *   noDrag?: boolean,
     *   noDragEventsBubbling?: boolean,
     *   containerClasses?: string,
     *   containerStyles?: string,
     *   disableDefaultStyles?: boolean,
     *   name?: string,
     *   inputElement?: any,
     *   required?: boolean,
     *   dropText?: string,
     *   fileLimit?: number,
     *   ondragenter?: (detail: any) => void,
     *   ondragover?: (detail: any) => void,
     *   ondragleave?: (detail: any) => void,
     *   ondrop?: (detail: any) => void,
     *   ondroprejected?: (detail: any) => void,
     *   ondropaccepted?: (detail: any) => void,
     *   onfiledropped?: (detail: any) => void,
     *   onfiledialogcancel?: () => void,
     *   children?: import('svelte').Snippet
     * }}
     */
    let {
        accept = '',
        disabled = false,
        getFilesFromEvent = fromEvent,
        maxSize = Infinity,
        minSize = 0,
        multiple = true,
        preventDropOnDocument = true,
        noClick = false,
        noKeyboard = false,
        noDrag = false,
        noDragEventsBubbling = false,
        containerClasses = '',
        containerStyles = '',
        disableDefaultStyles = false,
        name = '',
        inputElement = $bindable(undefined),
        required = false,
        dropText = 'Drag and drop some files here, or click to select files',
        fileLimit = 5,
        ondragenter,
        ondragover,
        ondragleave,
        ondrop,
        ondroprejected,
        ondropaccepted,
        onfiledropped,
        onfiledialogcancel,
        children
    } = $props();

    let isLoading = $state(false);
    let isError = $state(false);
    let isSuccess = $state(false);
    let reason = $state('');

    const defaultSuccessMesssage = "Upload succeeded!";
    const defaultErrorMesssage = "Upload failed!";

    let innerDropText = $derived.by(() => {
        if (isLoading) return "Uploading...";
        if (isSuccess) return defaultSuccessMesssage;
        if (isError) return reason;
        return dropText;
    });

    let innerDisabled = $derived.by(() => {
        if (isLoading || isSuccess || isError) return true;
        return disabled;
    });

    const duration = 1500;

    //state
    let dropState = {
        isFocused: false,
        isFileDialogActive: false,
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        /** @type {any} */
        draggedFiles: [],
        /** @type {any} */
        acceptedFiles: [],
        /** @type {any} */
        fileRejections: []
    };

    /** @type {any} */
    let rootRef;

    function resetState() {
        dropState.isFileDialogActive = false;
        dropState.isDragActive = false;
        dropState.draggedFiles = [];
        dropState.acceptedFiles = [];
        dropState.fileRejections = [];
    }

    // Fn for opening the file dialog programmatically
    function openFileDialog() {
        if (inputElement) {
            inputElement.value = null; // TODO check if null needs to be set
            dropState.isFileDialogActive = true;
            inputElement.click();
        }
    }

    // Cb to open the file dialog when SPACE/ENTER occurs on the dropzone
    /** @param {any} event */
    function onKeyDownCb(event) {
      // Ignore keyboard events bubbling up the DOM tree
        if (!rootRef || !rootRef.isEqualNode(event.target)) {
            return;
        }

        if (event.keyCode === 32 || event.keyCode === 13) {
            event.preventDefault();
            openFileDialog();
        }
    }

    // Update focus state for the dropzone
    function onFocusCb() {
        dropState.isFocused = true;
    }
    function onBlurCb() {
        dropState.isFocused = false;
    }
  
    // Cb to open the file dialog when click occurs on the dropzone
    function onClickCb() {
        if (noClick) {
            return;
        }

        // In IE11/Edge the file-browser dialog is blocking, therefore, use setTimeout()
        // to ensure React can handle state changes
        // See: https://github.com/react-dropzone/react-dropzone/issues/450
        if (isIeOrEdge()) {
            setTimeout(openFileDialog, 0);
        } else {
            openFileDialog();
        }
    }
  
    /** @param {any} event */
    function onDragEnterCb(event) {
        event.preventDefault();
        stopPropagation(event);

        dragTargetsRef = [...dragTargetsRef, event.target];

        if (isEvtWithFiles(event)) {
            Promise.resolve(getFilesFromEvent(event)).then(draggedFiles => {
                if (isPropagationStopped(event) && !noDragEventsBubbling) {
                    return;
                }

                dropState.draggedFiles = draggedFiles;
                dropState.isDragActive = true;

                ondragenter?.({
                    dragEvent: event
                });
            });
        }
    }
  
    /** @param {any} event */
    function onDragOverCb(event) {
        event.preventDefault();
        stopPropagation(event);

        if (event.dataTransfer) {
            try {
                event.dataTransfer.dropEffect = "copy";
            } catch {} /* eslint-disable-line no-empty */
        }

        if (isEvtWithFiles(event)) {
            ondragover?.({
                dragEvent: event
            });
        }

        return false;
    }
  
    /** @param {any} event */
    function onDragLeaveCb(event) {
        event.preventDefault();
        stopPropagation(event);

        // Only deactivate once the dropzone and all children have been left
        const targets = dragTargetsRef.filter(target => rootRef && rootRef.contains(target));
        // Make sure to remove a target present multiple times only once
        // (Firefox may fire dragenter/dragleave multiple times on the same element)
        const targetIdx = targets.indexOf(event.target);
        if (targetIdx !== -1) {
            targets.splice(targetIdx, 1);
        }
        dragTargetsRef = targets;
        if (targets.length > 0) {
            return;
        }

        dropState.isDragActive = false;
        dropState.draggedFiles = [];

        if (isEvtWithFiles(event)) {
            ondragleave?.({
                dragEvent: event
            });
        }
    }
  
    /** @param {any} event */
    function onDropCb(event) {
        event.preventDefault();
        stopPropagation(event);

        dragTargetsRef = [];

        if (isEvtWithFiles(event)) {
            onfiledropped?.({
                event
            });
            Promise.resolve(getFilesFromEvent(event)).then(files => {
                if (isPropagationStopped(event) && !noDragEventsBubbling) {
                    return;
                }

                /** @type {any[]} */
                let acceptedFiles = [];
                /** @type {any[]} */
                let fileRejections = [];

                /** @type {Promise<any>[]} */
                const promises = [];
                isLoading = true;
                files.forEach(file => {
                    promises.push(new Promise((resolve, reject) => {
                        const [accepted, acceptError] = fileAccepted(file, accept);
                        const [sizeMatch, sizeError] = fileMatchSize(file, minSize, maxSize);
                        getBase64(file).then(data => {
                            if (accepted && sizeMatch) {
                                acceptedFiles.push({
                                    file_name: file.name,
                                    file_path: file.path,
                                    file_data: data,
                                    content_type: file.type,
                                    file_size: file.size
                                });
                            } else {
                                const errors = [acceptError, sizeError].filter(Boolean);
                                fileRejections.push({ file, errors });
                            }
                            resolve('done');
                        });
                    }));
                });

                Promise.all(promises).then(() => {
                    isLoading = false;
                    if (acceptedFiles.length >= fileLimit) {
                        acceptedFiles = acceptedFiles.slice(0, Math.max(fileLimit, 0));
                    }

                    if (!multiple && acceptedFiles.length > 1) {
                        // Reject everything and empty accepted files
                        acceptedFiles.forEach(file => {
                            fileRejections.push({ file, errors: [TOO_MANY_FILES_REJECTION] });
                        });
                        acceptedFiles.splice(0);
                    }

                    // Files dropped keep input in sync
                    if (event.dataTransfer) {
                        inputElement.files = event.dataTransfer.files;
                    }

                    dropState.acceptedFiles = acceptedFiles;
                    dropState.fileRejections = fileRejections;

                    ondrop?.({
                        acceptedFiles,
                        fileRejections,
                        event
                    });

                    if (fileRejections.length > 0) {
                        ondroprejected?.({
                            fileRejections,
                            event
                        });

                        isError = true;
                        reason = fileRejections[0]?.errors[0]?.message || defaultErrorMesssage;
                        setTimeout(() => {
                            reason = '';
                            isError = false;
                        }, duration);
                    }

                    if (acceptedFiles.length > 0) {
                        ondropaccepted?.({
                            acceptedFiles,
                            event
                        });
                    }

                    if (acceptedFiles.length > 0 && fileRejections.length === 0) {
                        isSuccess = true;
                        setTimeout(() => {
                            isSuccess = false;
                        }, duration);
                    }
                });
            });
        }
        resetState();
    }
  
    /** @param {any} fn */
    function composeHandler(fn) { return innerDisabled ? null : fn; }

    /** @param {any} fn */
    function composeKeyboardHandler(fn) { return noKeyboard ? null : composeHandler(fn); }

    /** @param {any} fn */
    function composeDragHandler(fn) { return noDrag ? null : composeHandler(fn); }
  
    /** @param {any} event */
    function stopPropagation(event) {
        if (noDragEventsBubbling) {
            event.stopPropagation();
        }
    }
  
    // allow the entire document to be a drag target
    /** @param {any} event */
    function onDocumentDragOver(event) {
        if (preventDropOnDocument) {
            event.preventDefault();
        }
    }
  
    /** @type {any[]} */
    let dragTargetsRef = [];
    /** @param {any} event */
    function onDocumentDrop(event) {
        if (!preventDropOnDocument) {
            return;
        }
        if (rootRef && rootRef.contains(event.target)) {
            // If we intercepted an event for our instance, let it propagate down to the instance's onDrop handler
            return;
        }
        event.preventDefault();
        dragTargetsRef = [];
    }
  
    // Update file dialog active state when the window is focused on
    function onWindowFocus() {
        // Execute the timeout only if the file dialog is opened in the browser
        if (dropState.isFileDialogActive) {
            setTimeout(() => {
                if (inputElement) {
                    const { files } = inputElement;

                    if (!files.length) {
                        dropState.isFileDialogActive = false;
                        onfiledialogcancel?.();
                    }
                }
            }, 300);
        }
    }
  
    onDestroy(() => {
        // This is critical for canceling the timeout behaviour on `onWindowFocus()`
        inputElement = null;
    });
  
    /** @param {any} event */
    function onInputElementClick(event) {
        event.stopPropagation();
    }
</script>

<svelte:window onfocus={onWindowFocus} ondragover={onDocumentDragOver} ondrop={onDocumentDrop} />


<div
    bind:this={rootRef}
    tabindex="0"
    role="button"
    class="{disableDefaultStyles ? '' : 'file-dropzone'} {containerClasses}"
    style={`${containerStyles}`}
    onkeydown={composeKeyboardHandler(onKeyDownCb)}
    onfocus={composeKeyboardHandler(onFocusCb)}
    onblur={composeKeyboardHandler(onBlurCb)}
    onclick={composeHandler(onClickCb)}
    ondragenter={composeDragHandler(onDragEnterCb)}
    ondragover={composeDragHandler(onDragOverCb)}
    ondragleave={composeDragHandler(onDragLeaveCb)}
    ondrop={composeDragHandler(onDropCb)}
>
    <input
        {accept}
        {multiple}
        {required}
        type="file"
        {name}
        autocomplete="off"
        tabindex="-1"
        onchange={onDropCb}
        onclick={onInputElementClick}
        bind:this={inputElement}
        style="display: none;"
    />
    {#if children}
        {@render children()}
    {:else}
        <div class="add-file-icon">
            <i class="bx bxs-image-add"></i>
        </div>
    {/if}
</div>