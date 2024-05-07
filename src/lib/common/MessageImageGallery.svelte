<script>
    import { onMount } from 'svelte';
	import FileGallery from '$lib/common/FileGallery.svelte';
	import { getUserStore } from '$lib/helpers/store';
	import { PUBLIC_SERVICE_URL } from '$env/static/public';

    /** @type {string} */
    export let galleryClasses = '';

    /** @type {string} */
    export let galleryStyles = '';

    /** @type {() => Promise<any>} */
    export let fetchFiles = () => Promise.resolve([]);

    /** @type {any[]} */
    let files = [];
    /** @type {string} */
    let token = "";

    onMount(() => {
        const user = getUserStore();
        token = user.token;
        fetchFiles().then(data => {
            // @ts-ignore
            files = data?.filter(item => !!item.file_url)?.map(item => {
                return {
                    ...item,
                    file_data: `${PUBLIC_SERVICE_URL}${item.file_url}?access_token=${token}`
                };
            }) || [];
        });
    });
</script>

<div>
    <FileGallery
        containerClasses={galleryClasses}
        containerStyles={galleryStyles}
        files={files}
    />
</div>