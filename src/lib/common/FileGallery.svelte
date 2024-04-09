<script>
    import { LightboxGallery, GalleryThumbnail, GalleryImage } from 'svelte-lightbox';
    import Viewport from 'svelte-viewport-info';

    /** @type {any[]} */
    export let files = [];

    /** @type {boolean} */
    export let needDelete = true;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {(args0: number) => void} */
    export let onDelete = () => {};

    let isLite = false;
    const screenWidthThreshold = 500;

    $: {
        isLite = Viewport.Width <= screenWidthThreshold;
    }

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
            <div class="image-gallery-container">
                {#each files as file, idx (idx)}
                    <div class={`gallery-item ${isLite ? 'lite-gallery-item' : ''}`}>
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
                                <img class="gallery-item-image" src={file.url} alt={''}>
                            </div>
                        </GalleryThumbnail>
                    </div>
                {/each}
            </div>
        </svelte:fragment>

        {#each files as file, idx (idx)}
            <GalleryImage title={file.file_name}>
                <img src={file.url} alt={''} />
                <div class="item-text">{file.file_name}</div>
            </GalleryImage>
        {/each}
    </LightboxGallery>
{/if}
