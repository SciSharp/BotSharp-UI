<script>
	import { EXCEL_ICON, PDF_ICON, isExcel, isPdf } from '$lib/helpers/utils/file';
    import { LightboxGallery, GalleryThumbnail, GalleryImage } from 'svelte-lightbox';

    /** @type {any[]} */
    export let files = [];

    /** @type {boolean} */
    export let needDelete = false;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {(args0: number) => void} */
    export let onDelete = () => {};

    /** @type {string} */
    export let containerClasses = "";

    /** @type {string} */
    export let containerStyles = "";

    /** @type {boolean} */
    export let disableDefaultStyles = false;

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
<div
    class="{disableDefaultStyles ? '' : 'file-gallery-list'} {containerClasses}"
    style={`${containerStyles}`}
>
    <LightboxGallery transitionDuration={100}>
        <svelte:fragment slot="thumbnail">
            {#each files as file, idx (idx)}
                <div class={`gallery-item`}>
                    <GalleryThumbnail style="width: 100%; height: 100%; display: flex;" id={idx}>
                        <div class="gallery-item-wrapper">
                            {#if needDelete}
                                <div
                                    class="gallery-item-icon"
                                    tabindex="0"
                                    role="button"
                                    on:keydown={() => {}}
                                    on:click={e => handleDeleteFile(e, idx)}
                                >
                                    <i class="bx bx-trash" />
                                </div>
                            {/if}
                            {#if isPdf(file.file_type || file.file_name)}
                                <img class="gallery-item-image" src={PDF_ICON} alt={''}>
                            {:else if isExcel(file.file_type || file.file_name)}
                                <img class="gallery-item-image" src={EXCEL_ICON} alt={''}>
                            {:else}
                                <img class="gallery-item-image" src={file.file_data} alt={''}>
                            {/if}
                        </div>
                    </GalleryThumbnail>
                </div>
            {/each}
        </svelte:fragment>

        {#each files as file, idx (idx)}
            <GalleryImage title={file.file_name}>
                {#if isPdf(file.file_type || file.file_name)}
                    <img src={PDF_ICON} alt={''} />
                {:else if isExcel(file.file_type || file.file_name)}
                    <img src={EXCEL_ICON} alt={''} />
                {:else}
                    <img src={file.file_data} alt={''} />
                {/if}
                {#if !!file.file_name}
                    <div class="item-text">{file.file_name}</div>
                {/if}
            </GalleryImage>
        {/each}
    </LightboxGallery>
</div>
{/if}