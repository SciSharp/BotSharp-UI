<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import Swal from 'sweetalert2';
    import { _ } from 'svelte-i18n';
    import { Col, Row, Button } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
    import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
    import { getConversation, deleteConversation, getDialogs } from '$lib/services/conversation-service.js';
    import Overview from './conv-overview.svelte'
    import States from './conv-states.svelte';
    import Dialog from './conv-dialogs.svelte';

    const params = $page.params;
    const dialogCount = 100;

    let isLoading = false;

    /** @type {import('$conversationTypes').ConversationModel} */
    let conversation;

    /** @type {import('$conversationTypes').ChatResponseModel[]} */
    let dialogs = [];


    onMount(async () => {
        isLoading = true;
        conversation = await getConversation(params.conversationId, true);
        isLoading = false;
        dialogs = await getDialogs(conversation.id, dialogCount);
    });  

    function handleConversationDeletion() {
        // @ts-ignore
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            customClass: { confirmButton: 'danger-background' },
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.value) {
                await deleteConversation(conversation.id);
                goto("page/conversation");
            }
        });
    }

</script>

<HeadTitle title={conversation?.title || 'Not found'} />
<Breadcrumb title="{$_('Conversation')}" pagetitle="{$_('Conversation Detail')}" />

<LoadingToComplete {isLoading} />

{#if conversation}
    <Row>
        <Col style="flex: 40%;">
            <Overview {conversation} />
            <States {conversation} />
        </Col>
        <Col style="flex: 60%;">
            <Dialog {conversation} {dialogs} />
        </Col>
    </Row>
    <Row>
        <div class="mb-4">
            <Button
                class="btn btn-danger btn-hover rounded"
                on:click={() => handleConversationDeletion()}
            >
                <i class="mdi mdi-delete"></i>{$_('Delete Conversation')}
            </Button>
        </div>
    </Row>
{/if}