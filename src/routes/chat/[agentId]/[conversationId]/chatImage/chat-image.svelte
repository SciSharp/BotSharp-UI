<script>
    import { onMount } from 'svelte';
	import FileGallery from '$lib/common/FileGallery.svelte';
	import { getUserStore } from '$lib/helpers/store';
	import { getConversationFiles } from '$lib/services/conversation-service';
	import { PUBLIC_SERVICE_URL } from '$env/static/public';
    import { page } from '$app/stores';
	
    /** @type {any} */
    export let message;

    /** @type {any[]} */
    let files = [];
    /** @type {string} */
    let token = "";

    onMount(() => {
        const user = getUserStore();
        token = user.token;
        getConversationFiles($page.params.conversationId, message?.message_id).then(data => {
            // @ts-ignore
            files = data?.filter(item => !!item.file_url)?.map(item => {
                return {
                    ...item,
                    file_data: `${PUBLIC_SERVICE_URL}${item.file_url}?access_token=${token}`
                };
            }) || [];
        });
    });

    $: {
        // if (files.length === 0) {
        //     getConversationFiles($page.params.conversationId, message?.message_id).then(data => {
        //         // @ts-ignore
        //         files = data?.filter(item => !!item.file_url)?.map(item => {
        //             return {
        //                 ...item,
        //                 file_data: `${PUBLIC_SERVICE_URL}${item.file_url}?access_token=${token}`
        //             };
        //         }) || [];
        //     });
        // }
    }
</script>

<div style="display: block; margin-top: 3px;">
    <div style="display: flex; flex-wrap: wrap; gap: 3px;">
        <FileGallery files={files} />
    </div>
</div>