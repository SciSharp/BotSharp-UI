<script>
    import { onMount } from 'svelte';
	import FileGallery from '$lib/common/FileGallery.svelte';
	import { PUBLIC_SERVICE_URL } from '$env/static/public';
	import { userStore } from '$lib/helpers/store';
	import { isAudio } from '$lib/helpers/utils/file';

    /** @type {string} */
    export let galleryClasses = '';

    /** @type {string} */
    export let galleryStyles = '';

    /** @type {() => Promise<any>} */
    export let fetchFiles = () => Promise.resolve([]);

    /** @type {any[]} */
    let textFiles = [];

    /** @type {any[]} */
    let audioFiles = [];

    onMount(() => {
        if (fetchFiles != null && fetchFiles != undefined) {
            fetchFiles().then(data => {
                // @ts-ignore
                const validFiles = data?.filter(item => !!item.file_url) || [];
                // @ts-ignore
                textFiles = validFiles.filter(item => !isAudio(item.file_type)).map(item => {
                    return {
                        ...item,
                        file_data: `${PUBLIC_SERVICE_URL}${item.file_url}?access_token=${$userStore?.token}`
                    };
                });

                // @ts-ignore
                audioFiles = validFiles.filter(item => isAudio(item.file_type)).map(item => {
                    return {
                        ...item,
                        file_data: `${PUBLIC_SERVICE_URL}${item.file_url}?access_token=${$userStore?.token}`
                    };
                });
                console.log(audioFiles);
            });
        }
    });
</script>

<div>
    <FileGallery
        containerClasses={galleryClasses}
        containerStyles={galleryStyles}
        files={textFiles}
    />
    {#each audioFiles as aud}
        <audio src={aud.file_data}></audio>
    {/each}
</div>