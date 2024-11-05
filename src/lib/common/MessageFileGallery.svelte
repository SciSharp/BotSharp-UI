<script>
    import { onMount } from 'svelte';
    import { PUBLIC_SERVICE_URL } from '$env/static/public';
	import FileGallery from '$lib/common/FileGallery.svelte';
	import { userStore } from '$lib/helpers/store';
	import { isAudio, AUDIO_ICON } from '$lib/helpers/utils/file';
	import { isExternalUrl } from '$lib/helpers/utils/common';
    import AudioGallery from './AudioGallery.svelte';
	
    /** @type {string} */
    export let galleryClasses = '';

    /** @type {string} */
    export let galleryStyles = '';

    /** @type {string} */
    export let messageId;

    /** @type {() => Promise<any>} */
    export let fetchFiles = () => Promise.resolve([]);

    /** @type {import('$fileTypes').TextFileModel[]} */
    let textFiles = [];

    /** @type {import('$fileTypes').AudioFileModel[]} */
    let audioFiles = [];

    onMount(() => {
        if (fetchFiles != null && fetchFiles != undefined) {
            fetchFiles().then(data => {
                // @ts-ignore
                const validFiles = data?.filter(item => !!item.file_url) || [];
                // @ts-ignore
                textFiles = validFiles.filter(item => !isAudio(item.file_extension)).map(item => {
                    return {
                        file_name: item.file_name,
                        file_extension: item.file_extension,
                        file_data: isExternalUrl(item.file_url) ? item.file_url : `${PUBLIC_SERVICE_URL}${item.file_url}?access_token=${$userStore?.token}`,
                        file_download_url: isExternalUrl(item.file_download_url) ? item.file_download_url : `${PUBLIC_SERVICE_URL}${item.file_download_url}?access_token=${$userStore?.token}`
                    };
                });
                // @ts-ignore
                audioFiles = validFiles.filter(item => isAudio(item.file_extension)).map(item => {
                    return {
                        name: item.file_name,
                        cover: AUDIO_ICON,
                        artist: '',
                        url: isExternalUrl(item.file_url) ? item.file_url : `${PUBLIC_SERVICE_URL}${item.file_url}?access_token=${$userStore?.token}`
                    };
                });
            });
        }
    });

    /** @param {number} idx */
    function handleDownloadFile(idx) {
        const found = textFiles.find((_, index) => index === idx);
        if (found?.file_download_url) {
            window.open(found.file_download_url);
        }
    }
</script>


<FileGallery
    containerClasses={galleryClasses}
    containerStyles={galleryStyles}
    files={textFiles}
    showFileName
    needDownload
    onDownload={idx => handleDownloadFile(idx)}
/>
<AudioGallery
    id={messageId}
    containerClasses={galleryClasses}
    containerStyles={galleryStyles}
    audios={audioFiles}
/>