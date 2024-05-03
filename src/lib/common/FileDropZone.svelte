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
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
  
    //props
    /** @type {string} */
    export let accept;
    export let disabled = false;
    export let getFilesFromEvent = fromEvent;
    export let maxSize = Infinity;
    export let minSize = 0;
    export let multiple = true;
    export let preventDropOnDocument = true;
    export let noClick = false;
    export let noKeyboard = false;
    export let noDrag = false;
    export let noDragEventsBubbling = false;
    export let containerClasses = "";
    export let containerStyles = "";
    export let disableDefaultStyles = false;
    export let name = "";
    /** @type {any} */
    export let inputElement = undefined;
    export let required = false;
    export let dropText = "Drag and drop some files here, or click to select files";
    export let fileLimit = 5;

    let innerDropText = dropText;
    let innerDisabled = disabled;
    let isLoading = false;
    let isError = false;
    let isSuccess = false;
    let reason = '';

    const defaultSuccessMesssage = "Upload succeeded!";
    const defaultErrorMesssage = "Upload failed!";

    $: {
        if (isLoading) {
            innerDropText = "Uploading...";
            innerDisabled = true;
        } else if (isSuccess) {
            innerDropText = defaultSuccessMesssage;
            innerDisabled = true;
        } else if (isError) {
            innerDropText = reason;
            innerDisabled = true;
        } else {
            innerDropText = dropText;
            innerDisabled = disabled;
        }
    }

    const duration = 3000;
    const dispatch = createEventDispatcher();
  
    //state
    let state = {
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
        state.isFileDialogActive = false;
        state.isDragActive = false;
        state.draggedFiles = [];
        state.acceptedFiles = [];
        state.fileRejections = [];
    }
  
    // Fn for opening the file dialog programmatically
    function openFileDialog() {
        if (inputElement) {
            inputElement.value = null; // TODO check if null needs to be set
            state.isFileDialogActive = true;
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
        state.isFocused = true;
    }
    function onBlurCb() {
        state.isFocused = false;
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

                state.draggedFiles = draggedFiles;
                state.isDragActive = true;

                dispatch("dragenter", {
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
            dispatch("dragover", {
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

        state.isDragActive = false;
        state.draggedFiles = [];

        if (isEvtWithFiles(event)) {
            dispatch("dragleave", {
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
            dispatch("filedropped", {
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

                    state.acceptedFiles = acceptedFiles;
                    state.fileRejections = fileRejections;

                    dispatch("drop", {
                        acceptedFiles,
                        fileRejections,
                        event
                    });

                    if (fileRejections.length > 0) {
                        dispatch("droprejected", {
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
                        dispatch("dropaccepted", {
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
  
    $: composeHandler = (/** @type {any} */ fn) => (innerDisabled ? null : fn);
  
    $: composeKeyboardHandler = (/** @type {any} */ fn) => (noKeyboard ? null : composeHandler(fn));
  
    $: composeDragHandler = (/** @type {any} */ fn) => (noDrag ? null : composeHandler(fn));
  
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
        if (state.isFileDialogActive) {
            setTimeout(() => {
                if (inputElement) {
                    const { files } = inputElement;

                    if (!files.length) {
                        state.isFileDialogActive = false;
                        dispatch("filedialogcancel");
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

<svelte:window on:focus={onWindowFocus} on:dragover={onDocumentDragOver} on:drop={onDocumentDrop} />


<div
    bind:this={rootRef}
    tabindex="0"
    role="button"
    class="{disableDefaultStyles ? '' : 'file-dropzone'} {containerClasses}"
    style={`${containerStyles}`}
    on:keydown={composeKeyboardHandler(onKeyDownCb)}
    on:focus={composeKeyboardHandler(onFocusCb)}
    on:blur={composeKeyboardHandler(onBlurCb)}
    on:click={composeHandler(onClickCb)}
    on:dragenter={composeDragHandler(onDragEnterCb)}
    on:dragover={composeDragHandler(onDragOverCb)}
    on:dragleave={composeDragHandler(onDragLeaveCb)}
    on:drop={composeDragHandler(onDropCb)}
>
    <input
        {accept}
        {multiple}
        {required}
        type="file"
        {name}
        autocomplete="off"
        tabindex="-1"
        on:change={onDropCb}
        on:click={onInputElementClick}
        bind:this={inputElement}
        style="display: none;"
    />
    <slot>
        <div class="add-file-icon">
            <i class="bx bxs-image-add" />
        </div>
    </slot>
</div>