<script>
    import { Col, Row } from 'sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
    import Dialog from './dialog.svelte';
    import Overview from './conversation-overview.svelte'
    import { getConversation } from '$lib/services/conversation-service.js';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    const params = $page.params;

    /** @type {import('$types').ConversationModel} */
    export let conversation;

    onMount(async () => {
        conversation = await getConversation(params.conversationId);
    });  
</script>

<HeadTitle title="Conversation" />
<Breadcrumb title="Conversation" pagetitle="Detail" />

{#if conversation}
<Row>
    <Col class="col-4">
        <Overview conversation={conversation}/>
    </Col>
    <Col class="col-8">
        <Dialog conversationId={conversation?.id} />        
    </Col>
</Row>
{/if}
