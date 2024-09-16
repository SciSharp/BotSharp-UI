<script>
	import {
        AUDIO_ICON, EXCEL_ICON, HTML_ICON, PDF_ICON, TXT_ICON, WORD_ICON,
        isAudio, isExcel, isHtml, isPdf, isTxt, isWord
    } from '$lib/helpers/utils/file';
    import { LightboxGallery, GalleryThumbnail, GalleryImage } from 'svelte-lightbox';

    /** @type {import('$fileTypes').TextFileModel[]} */
    export let files = [];

    /** @type {boolean} */
    export let needDelete = false;

    /** @type {boolean} */
    export let needDownload = false;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {boolean} */
    export let showFileName = false;

    /** @type {boolean} */
    export let showPrefix = false;

    /** @type {boolean} */
    export let showSuffix = false;

    /** @type {string} */
    export let gap = '3px';

    /** @type {string} */
    export let containerClasses = "";

    /** @type {string} */
    export let containerStyles = "";

    /** @type {boolean} */
    export let disableDefaultStyles = false;

    /** @type {(args0: number) => void} */
    export let onDelete = () => {};

    /** @type {(args0: number) => void} */
    export let onDownload = () => {};

    

    /**
	 * @param {any} e
	 * @param {number} idx
	 */
    function handleDeleteFile(e, idx) {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        onDelete && onDelete(idx);
    }

    /**
	 * @param {any} e
	 * @param {number} idx
	 */
     function handleDownloadFile(e, idx) {
        if (disabled) return;

        e.preventDefault();
        e.stopPropagation();
        onDownload?.(idx);
    }
</script>


<div
    class="{disableDefaultStyles ? '' : 'file-gallery-list'} {containerClasses}"
    style={`gap: ${gap}; ${containerStyles}`}
>
    {#if showPrefix}
        <div class="gallery-item">
            <slot name="prefix" />
        </div>
    {/if}

    {#if files?.length > 0}
        <LightboxGallery transitionDuration={100}>
            <svelte:fragment slot="thumbnail">
                {#each files as file, idx (idx)}
                    <div class="gallery-item">
                        <GalleryThumbnail class="item-thumbnail-wrapper" id={idx}>
                            <div class="gallery-item-wrapper" style={`${showFileName ? 'height: 80%;' : ''}`}>
                                <div class="gallery-item-inner" style={`${showFileName ? 'width: 80%;' : ''}`}>
                                    {#if needDelete}
                                        <div
                                            class="gallery-item-icon delete-icon clickable"
                                            tabindex="0"
                                            role="button"
                                            data-bs-toggle="tooltip"
                                            data-bs-placement="top"
                                            title="Delete"
                                            on:keydown={() => {}}
                                            on:click={e => handleDeleteFile(e, idx)}
                                        >
                                            <i class="bx bx-trash" />
                                        </div>
                                    {/if}
                                    {#if needDownload}
                                        <div
                                            class="gallery-item-icon download-icon clickable"
                                            tabindex="0"
                                            role="button"
                                            data-bs-toggle="tooltip"
                                            data-bs-placement="top"
                                            title={`${isHtml(file.file_extension || file.file_name) ? 'Download' : 'Go to web page'}`}
                                            on:keydown={() => {}}
                                            on:click={e => handleDownloadFile(e, idx)}
                                        >
                                            {#if isHtml(file.file_extension || file.file_name)}
                                                <i class="mdi mdi-web" />
                                            {:else}
                                                <i class="bx bx-download" />
                                            {/if}
                                        </div>
                                    {/if}
                                    {#if isPdf(file.file_extension || file.file_name)}
                                        <img class="gallery-item-image" src={PDF_ICON} alt={''}>
                                    {:else if isExcel(file.file_extension || file.file_name)}
                                        <img class="gallery-item-image" src={EXCEL_ICON} alt={''}>
                                    {:else if isAudio(file.file_extension || file.file_name)}
                                        <img class="gallery-item-image" src={AUDIO_ICON} alt={''}>
                                    {:else if isTxt(file.file_extension || file.file_name)}
                                        <img class="gallery-item-image" src={TXT_ICON} alt={''}>
                                    {:else if isWord(file.file_extension || file.file_name)}
                                        <img class="gallery-item-image" src={WORD_ICON} alt={''}>
                                    {:else if isHtml(file.file_extension || file.file_name)}
                                        <img class="gallery-item-image" src={HTML_ICON} alt={''}>
                                    {:else}
                                        <img class="gallery-item-image" src={file.file_data} alt={''}>
                                    {/if}
                                </div>
                            </div>
                            {#if showFileName && file.file_name}
                                <div 
                                    class="gallery-item-name ellipsis"
                                    data-bs-toggle="tooltip"
                                    data-bs-placement="top"
                                    title={file.file_name}
                                >
                                    {file.file_name}
                                </div>
                            {/if}
                        </GalleryThumbnail>
                    </div>
                {/each}
            </svelte:fragment>

            {#each files as file, idx (idx)}
                <GalleryImage title={file.file_name}>
                    {#if isPdf(file.file_extension || file.file_name)}
                        <img src={PDF_ICON} alt={''} />
                    {:else if isExcel(file.file_extension || file.file_name)}
                        <img src={EXCEL_ICON} alt={''} />
                    {:else if isAudio(file.file_extension || file.file_name)}
                        <img src={AUDIO_ICON} alt={''} />
                    {:else if isTxt(file.file_extension || file.file_name)}
                        <img src={TXT_ICON} alt={''} />
                    {:else if isWord(file.file_extension || file.file_name)}
                        <img src={WORD_ICON} alt={''} />
                    {:else if isHtml(file.file_extension || file.file_name)}
                        <img src={HTML_ICON} alt={''} />
                    {:else}
                        <img src={file.file_data} alt={''} />
                    {/if}
                    {#if !!file.file_name}
                        <div class="item-text">{file.file_name}</div>
                    {/if}
                </GalleryImage>
            {/each}
        </LightboxGallery>
    {/if}

    {#if showSuffix}
        <div class="gallery-item">
            <slot name="suffix" />
        </div>
    {/if}
</div>
