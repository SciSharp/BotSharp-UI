<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
    import { _ } from 'svelte-i18n';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
    import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
    import { getConversation, deleteConversation, getDialogs } from '$lib/services/conversation-service.js';
    import Overview from './conv-overview.svelte'
    import States from './conv-states.svelte';
    import Dialog from './conv-dialogs.svelte';

    const params = $page.params;
    const dialogCount = 100;

    let isLoading = $state(false);

    /** @type {import('$conversationTypes').ConversationModel | undefined | null} */
    let conversation = $state(undefined);

    /** @type {import('$conversationTypes').ChatResponseModel[]} */
    let dialogs = $state([]);

    onMount(async () => {
        isLoading = true;
        conversation = await getConversation(params.conversationId, true);
        isLoading = false;
        dialogs = await getDialogs(conversation.id, dialogCount);
    });

    let confirmOpen = $state(false);

    function handleConversationDeletion() {
        confirmOpen = true;
    }

    function closeConfirm() {
        confirmOpen = false;
    }

    async function onConfirmDelete() {
        closeConfirm();
        if (conversation?.id) {
            await deleteConversation(conversation.id);
            goto("page/conversation");
        }
    }

    function goBack() {
        goto('page/conversation');
    }

    function openInChat() {
        if (!conversation) return;
        window.open(`/chat/${conversation.agent_id}/${conversation.id}`);
    }
</script>

<HeadTitle title={conversation?.title || 'Not found'} />
<Breadcrumb title={$_('Conversation')} pagetitle={$_('Conversation Detail')} />

<LoadingToComplete {isLoading} />

<ConfirmModal
    isOpen={confirmOpen}
    icon="error"
    title="Are you sure?"
    text="You won't be able to revert this!"
    confirmBtnText="Yes, delete it!"
    cancelBtnText="No"
    confirmBtnColor="danger"
    confirm={onConfirmDelete}
    cancel={closeConfirm}
    toggleModal={closeConfirm}
/>

{#if conversation}
    <div class="space-y-4 pb-8">
        <!-- Action toolbar -->
        <div class="overflow-hidden rounded-2xl bg-linear-to-r from-primary/5 via-white to-info/5 shadow-sm ring-1 ring-black/5 dark:from-primary/10 dark:via-gray-800 dark:to-info/10 dark:ring-white/10">
            <div class="flex items-center gap-3 px-4 py-3 sm:px-6">
                <div class="flex min-w-0 flex-1 items-center gap-2">
                    <button
                        type="button"
                        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors cursor-pointer hover:bg-primary/10 hover:text-primary"
                        aria-label="Back to conversations"
                        title="Back to conversations"
                        onclick={goBack}
                    >
                        <i class="mdi mdi-arrow-left text-lg leading-none"></i>
                    </button>
                    <span class="inline-flex h-6 max-w-[8rem] shrink-0 items-center rounded-full bg-primary/10 px-2 text-xs font-semibold uppercase tracking-wider text-primary sm:max-w-[14rem]" title={conversation.id ?? ''}>
                        <i class="mdi mdi-pound mr-0.5 shrink-0 text-sm leading-none"></i>
                        <span class="truncate">{conversation.id ?? '—'}</span>
                    </span>
                    <span class="hidden min-w-0 flex-1 truncate text-sm font-medium text-dark dark:text-gray-100 sm:inline-block" title={conversation.title}>
                        {conversation?.title || ''}
                    </span>
                </div>
                <div class="flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-md bg-info/10 px-3 py-1.5 text-sm font-medium text-info transition-colors cursor-pointer hover:bg-info/20"
                        title="Open in chat"
                        onclick={openInChat}
                    >
                        <i class="mdi mdi-chat-processing-outline text-base leading-none"></i>
                        <span class="hidden sm:inline">Open in Chat</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Main content grid -->
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div class="flex flex-col gap-4 lg:col-span-2 lg:max-h-[calc(100vh-15rem)] lg:min-h-0">
                <Overview {conversation} />
                <States {conversation} />
            </div>
            <div class="lg:col-span-3">
                <Dialog {conversation} {dialogs} />
            </div>
        </div>

        <!-- Danger zone -->
        <div class="rounded-2xl bg-white shadow-xl ring-1 ring-danger/20 dark:bg-gray-800 dark:ring-danger/30">
            <div class="border-b border-danger/15 px-6 py-4">
                <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
                        <i class="mdi mdi-alert-octagon-outline text-xl"></i>
                    </span>
                    <div>
                        <h4 class="mb-0 text-base font-semibold text-dark dark:text-gray-100">Danger Zone</h4>
                        <p class="mb-0 text-xs text-muted">Irreversible actions for this conversation</p>
                    </div>
                </div>
            </div>
            <div class="p-4 sm:p-6">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div class="inline-flex items-center gap-2 text-sm text-muted">
                        <i class="mdi mdi-alert-circle-outline shrink-0 text-base leading-none text-danger"></i>
                        <span>Deleting this conversation will permanently remove all messages, states, and attached files.</span>
                    </div>
                    <button
                        type="button"
                        class="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-danger px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors cursor-pointer hover:bg-danger/90"
                        onclick={() => handleConversationDeletion()}
                    >
                        <i class="mdi mdi-delete text-base leading-none"></i>
                        <span>{$_('Delete Conversation')}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
