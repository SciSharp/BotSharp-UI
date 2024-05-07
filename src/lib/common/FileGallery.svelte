<script>
    import { LightboxGallery, GalleryThumbnail, GalleryImage } from 'svelte-lightbox';

    /** @type {any[]} */
    export let files = [];

    /** @type {boolean} */
    export let needDelete = false;

    /** @type {boolean} */
    export let disabled = false;

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
                            <img class="gallery-item-image" src={file.file_data} alt={''}>
                        </div>
                    </GalleryThumbnail>
                </div>
            {/each}
        </svelte:fragment>

        {#each files as file, idx (idx)}
            <GalleryImage title={file.file_name}>
                <img src={file.file_data} alt={''} />
                {#if !!file.file_name}
                <div class="item-text">{file.file_name}</div>
                {/if}
            </GalleryImage>
        {/each}
    </LightboxGallery>
{/if}
