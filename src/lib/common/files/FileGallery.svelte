<script>
	import {
        AUDIO_ICON, EXCEL_ICON, HTML_ICON, PDF_ICON, TXT_ICON, WORD_ICON,
        isAudio, isExcel, isHtml, isPdf, isTxt, isWord
    } from '$lib/helpers/utils/file';
    import { LightboxGallery, GalleryThumbnail, GalleryImage } from 'svelte-lightbox';

    /**
     * @type {{
     *   files?: import('$fileTypes').TextFileModel[],
     *   needDelete?: boolean,
     *   needDownload?: boolean,
     *   disabled?: boolean,
     *   showFileName?: boolean,
     *   showPrefix?: boolean,
     *   showSuffix?: boolean,
     *   gap?: string,
     *   containerClasses?: string,
     *   containerStyles?: string,
     *   disableDefaultStyles?: boolean,
     *   onDelete?: (args0: number) => void,
     *   onDownload?: (args0: number) => void,
     *   prefix?: import('svelte').Snippet,
     *   suffix?: import('svelte').Snippet
     * }}
     */
    let {
        files = [],
        needDelete = false,
        needDownload = false,
        disabled = false,
        showFileName = false,
        showPrefix = false,
        showSuffix = false,
        gap = '3px',
        containerClasses = '',
        containerStyles = '',
        disableDefaultStyles = false,
        onDelete = () => {},
        onDownload = () => {},
        prefix,
        suffix
    } = $props();



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
            {@render prefix?.()}
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
                                            class="gallery-item-icon delete-icon cursor-pointer"
                                            tabindex="0"
                                            role="button"
                                            title="Delete"
                                            onkeydown={() => {}}
                                            onclick={e => handleDeleteFile(e, idx)}
                                        >
                                            <i class="bx bx-trash"></i>
                                        </div>
                                    {/if}
                                    {#if needDownload && !!file.file_download_url}
                                        <div
                                            class="gallery-item-icon download-icon cursor-pointer"
                                            tabindex="0"
                                            role="button"
                                            title={`${isHtml(file.file_extension || file.file_name) ? 'Download' : 'Go to web page'}`}
                                            onkeydown={() => {}}
                                            onclick={e => handleDownloadFile(e, idx)}
                                        >
                                            {#if isHtml(file.file_extension || file.file_name)}
                                                <i class="mdi mdi-web"></i>
                                            {:else}
                                                <i class="bx bx-download"></i>
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
            {@render suffix?.()}
        </div>
    {/if}
</div>


<style>
    /* ===== File gallery layout =====
       Replaces the legacy `_file.scss` rules (`.file-gallery-list`,
       `.gallery-item`, `.gallery-item-*`) that were dropped in the
       Tailwind v4 migration. Without these, gallery items lost their
       8em fixed box and image previews ballooned to natural size —
       this re-instates the constrained thumbnail grid using design
       tokens. Selectors are wrapped in :global() because some of the
       targeted classes (e.g. `.item-thumbnail-wrapper`) are passed as
       `class` props to third-party svelte-lightbox components and would
       otherwise be stripped by Svelte's CSS scoper. */
    :global(.file-gallery-list) {
        margin: 5px 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
    }
    :global(.file-gallery-list .gallery-item) {
        width: 8em;
        height: 8em;
    }
    :global(.file-gallery-list .item-thumbnail-wrapper) {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    :global(.file-gallery-list .gallery-item-wrapper) {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
    }
    :global(.file-gallery-list .gallery-item-inner) {
        position: relative;
        width: 100%;
        height: 100%;
    }
    :global(.file-gallery-list .gallery-item-image) {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
    }
    :global(.file-gallery-list .gallery-item-icon) {
        position: absolute;
        z-index: 500;
        font-size: 1.2em;
        border-radius: 5px;
        padding: 2px;
        line-height: 1;
    }
    :global(.file-gallery-list .gallery-item-icon i) {
        display: block;
    }
    :global(.file-gallery-list .delete-icon) {
        top: 3px;
        right: 3px;
        color: var(--color-danger);
        background-color: rgb(255 255 255 / 0.85);
    }
    :global(.file-gallery-list .delete-icon:hover) {
        color: white;
        background-color: var(--color-danger);
    }
    :global(.file-gallery-list .download-icon) {
        right: 3px;
        bottom: 3px;
        color: var(--color-info);
        background-color: rgb(255 255 255 / 0.85);
    }
    :global(.file-gallery-list .download-icon:hover) {
        color: white;
        background-color: var(--color-info);
    }
    :global(.file-gallery-list .gallery-item-name) {
        text-align: center;
        word-break: break-all;
        font-size: 0.7rem;
        line-height: 1.2;
    }
    /* Narrow viewports: shrink the thumbnail box (mirrors the
       legacy 500px media query). */
    @media (max-width: 500px) {
        :global(.file-gallery-list .gallery-item) {
            width: 5em;
            height: 5em;
        }
    }
</style>
