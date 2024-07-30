<script>
    import { onMount } from 'svelte';
	import FileGallery from '$lib/common/FileGallery.svelte';
	import { PUBLIC_SERVICE_URL } from '$env/static/public';
	import { userStore } from '$lib/helpers/store';

    /** @type {string} */
    export let galleryClasses = '';

    /** @type {string} */
    export let galleryStyles = '';

    /** @type {() => Promise<any>} */
    export let fetchFiles = () => Promise.resolve([]);

    /** @type {any[]} */
    let files = [];

    onMount(() => {
        if (fetchFiles != null && fetchFiles != undefined) {
            fetchFiles().then(data => {
                // @ts-ignore
                files = data?.filter(item => !!item.file_url)?.map(item => {
                    const isExternalUrl = /^(https?:\/\/)/.test(item.file_url);
                    return {
                        ...item,
                        file_data: isExternalUrl ? item.file_url : `${PUBLIC_SERVICE_URL}${item.file_url}?access_token=${$userStore?.token}`
                    };
                }) || [];
            });
        }
    });
</script>

<div>
    <FileGallery
        containerClasses={galleryClasses}
        containerStyles={galleryStyles}
        files={files}
    />
</div>