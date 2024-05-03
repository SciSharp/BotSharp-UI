<script>
    import { onMount } from 'svelte';
	import FileGallery from '$lib/common/FileGallery.svelte';
	import { getUserStore } from '$lib/helpers/store';
	import { getConversationFiles } from '$lib/services/conversation-service';
	
    /** @type {string} */
    export let conversationId;
    /** @type {string} */
    export let messageId;

    /** @type {any[]} */
    let files = [];
    /** @type {string} */
    let token = "";

    onMount(() => {
        const user = getUserStore();
        token = user.token;
    });

    $: {
        getConversationFiles(conversationId, messageId).then(data => {
            // @ts-ignore
            files = data?.filter(item => !!item.file_url)?.map(item => {
                return {
                    ...item,
                    file_data: `${item.file_url}?token=${token}`
                };
            }) || [];
        });
    }
</script>

<div style="display: block; margin-top: 3px;">
    <div style="display: flex; flex-wrap: wrap; gap: 3px;">
        <FileGallery files={files} />
    </div>
</div>