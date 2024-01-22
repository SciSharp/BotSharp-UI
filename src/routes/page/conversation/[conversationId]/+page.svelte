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
    import Swal from 'sweetalert2/dist/sweetalert2.js';
    import "sweetalert2/src/sweetalert2.scss";

    const params = $page.params;

    /** @type {import('$types').ConversationModel} */
    export let conversation;

    onMount(async () => {
        conversation = await getConversation(params.conversationId);
    });  

    function handleConversationDeletion() {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            customClass: 'conv-delete-modal',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.value) {
                await deleteConversation(conversation.id);
                // Swal.fire('Deleted!', 'Your file has been deleted.', 'success');
                window.location.href = "/page/conversation";
            }
        });
    }

</script>

<HeadTitle title={conversation?.title} />
<Breadcrumb title="Conversation" pagetitle="Conversation Detail" />

{#if conversation}
<Row>
    <Col class="col-4">
        <Overview conversation={conversation} />
        <States conversation={conversation} />
    </Col>
    <Col class="col-8">
        <Dialog conversation={conversation} />        
    </Col>
</Row>
{/if}
<Row>
    <div class="mb-4">
        <Button class="btn btn-soft-primary btn-hover rounded" on:click={() => handleConversationDeletion()}><i class="mdi mdi-delete"></i> Delete Conversation</Button>
    </div>
</Row>
