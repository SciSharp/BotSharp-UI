<script>
	import { EXCEL_ICON, PDF_ICON, TXT_ICON, WORD_ICON, isExcel, isPdf, isTxt, isWord } from '$lib/helpers/utils/file';
    import { LightboxGallery, GalleryThumbnail, GalleryImage } from 'svelte-lightbox';

    /** @type {any[]} */
    export let files = [];

    /** @type {boolean} */
    export let needDelete = false;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {boolean} */
    export let showFileName = false;

    /** @type {(args0: number) => void} */
    export let onDelete = () => {};

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
</script>

{#if files?.length > 0}
<LightboxGallery transitionDuration={100}>
    <svelte:fragment slot="thumbnail">
        {#each files as file, idx (idx)}
            <div class={`doc-gallery-item doc-grid-item`}>
                <GalleryThumbnail class="thumbnail-wrapper" id={idx}>
                    <div class="doc-gallery-item-wrapper" style={`${showFileName ? 'height: 80%;' : ''}`}>
                        <div class="doc-gallery-item-inner" style={`${showFileName ? 'width: 80%;' : ''}`}>
                            {#if needDelete}
                                <div
                                    class="doc-gallery-item-icon"
                                    tabindex="0"
                                    role="button"
                                    on:keydown={() => {}}
                                    on:click={e => handleDeleteFile(e, idx)}
                                >
                                    <i class="bx bx-trash" />
                                </div>
                            {/if}
                            {#if isPdf(file.file_extension || file.file_name)}
                                <img class="doc-gallery-item-image" src={PDF_ICON} alt={''}>
                            {:else if isExcel(file.file_extension || file.file_name)}
                                <img class="doc-gallery-item-image" src={EXCEL_ICON} alt={''}>
                            {:else if isTxt(file.file_extension || file.file_name)}
                                <img class="doc-gallery-item-image" src={TXT_ICON} alt={''}>
                            {:else if isWord(file.file_extension || file.file_name)}
                                <img class="doc-gallery-item-image" src={WORD_ICON} alt={''}>
                            {:else}
                                <img class="doc-gallery-item-image" src={file.file_data} alt={''}>
                            {/if}
                        </div>
                    </div>
                    {#if showFileName}
                        <div class="doc-gallery-item-name ellipsis">
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
            {:else if isTxt(file.file_extension || file.file_name)}
                <img src={TXT_ICON} alt={''} />
            {:else if isWord(file.file_extension || file.file_name)}
                <img src={WORD_ICON} alt={''} />
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