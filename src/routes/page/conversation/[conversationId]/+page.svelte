<script>
    import { Col, Row, Button } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
    import Dialog from './conv-dialogs.svelte';
    import Overview from './conv-overview.svelte'
    import States from './conv-states.svelte';
    import { getConversation, deleteConversation } from '$lib/services/conversation-service.js';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import Swal from 'sweetalert2'
    import { _ } from 'svelte-i18n'  

    const params = $page.params;

    /** @type {import('$conversationTypes').ConversationModel} */
    let conversation;

    onMount(async () => {
        conversation = await getConversation(params.conversationId);
    });  

    function handleConversationDeletion() {
        // @ts-ignore
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            customClass: 'custom-modal',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.value) {
                await deleteConversation(conversation.id);
                window.location.href = "page/conversation";
            }
        });
    }

</script>

<HeadTitle title={conversation?.title || 'Not found'} />
<Breadcrumb title="{$_('Conversation')}" pagetitle="{$_('Conversation Detail')}" />

{#if conversation}
<Row>
    <Col style="flex: 40%;">
        <Overview conversation={conversation} />
        <States conversation={conversation} />
    </Col>
    <Col style="flex: 60%;">
        <Dialog conversation={conversation} />        
    </Col>
</Row>
<Row>
    <div class="mb-4">
        <Button class="btn btn-danger btn-hover rounded" on:click={() => handleConversationDeletion()}><i class="mdi mdi-delete"></i>{$_('Delete Conversation')}</Button>
    </div>
</Row>
{/if}
