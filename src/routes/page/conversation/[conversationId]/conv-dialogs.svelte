<script>
    import { _ } from 'svelte-i18n';
    import util from "lodash";
    import { getConversationFiles, sendNotification } from '$lib/services/conversation-service.js';
    import { utcToLocal } from '$lib/helpers/datetime';
    import { formatNumber } from '$lib/helpers/utils/common';
	import { IMAGE_DATA_PREFIX, BOT_SENDERS } from '$lib/helpers/constants';
	import MessageFileGallery from '$lib/common/files/MessageFileGallery.svelte';
	import { FileSourceType } from '$lib/helpers/enums';
	import DialogModal from '$lib/common/modals/DialogModal.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
    import ConvDialogElement from './conv-dialog-element.svelte';

    const maxTextLength = 4096;
    const duration = 1500;

    /**
     * @type {{
     *   conversation: import('$conversationTypes').ConversationModel,
     *   dialogs?: import('$conversationTypes').ChatResponseModel[]
     * }}
     */
    let { conversation, dialogs = [] } = $props();

    /** @type {boolean} */
    let isOpenNotificationModal = $state(false);
    let isComplete = $state(false);

    /** @type {string} */
    let text = $state('');

    /**
     * @param {import('$conversationTypes').ChatResponseModel} dialog
     * @returns {boolean}
    */
    function showInRight(dialog) {
        return !BOT_SENDERS.includes(dialog?.sender?.role || '');
    }

    function goToChat() {
        window.open(`/chat/${conversation.agent_id}/${conversation.id}`);
    }

    function handleSendNotification() {
        isOpenNotificationModal = true;
    }

    function toggleNotificationModal() {
        isOpenNotificationModal = !isOpenNotificationModal;
        if (!isOpenNotificationModal) {
            text = '';
        }
    }

    function confirmMsg() {
        sendNotification(conversation.id, text).then(() => {
            isComplete = true;
            setTimeout(() => {
                isComplete = false;
            }, duration);
        }).finally(() => {
            isOpenNotificationModal = false;
            text = '';
        });
    }
</script>

<LoadingToComplete
    isComplete={isComplete}
    successText={'Notification sent!'}
/>

<DialogModal
    title={'Notification'}
    size={'xl'}
    isOpen={isOpenNotificationModal}
    toggleModal={() => toggleNotificationModal()}
    confirm={() => confirmMsg()}
    cancel={() => toggleNotificationModal()}
    confirmBtnText={'Send'}
    disableConfirmBtn={!util.trim(text)}
>
    <div class="notif-form">
        <label class="notif-label" for="notif-textarea">Message</label>
        <textarea
            id="notif-textarea"
            class="notif-textarea"
            rows="5"
            maxlength={maxTextLength}
            bind:value={text}
            placeholder="Enter the notification message you want to send to this conversation..."
        ></textarea>
        <div class="notif-counter" class:notif-counter-warning={(text?.length || 0) > maxTextLength * 0.8}>
            <i class="mdi mdi-counter"></i>
            <span>{formatNumber(text?.length || 0)} / {formatNumber(maxTextLength)}</span>
        </div>
    </div>
</DialogModal>

<div class="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
    <div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
        <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
                <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <i class="mdi mdi-message-text-outline text-xl"></i>
                </span>
                <div>
                    <h4 class="mb-0 text-base font-semibold text-dark dark:text-gray-100">{$_('Dialogs')}</h4>
                    <p class="mb-0 text-xs text-muted">{formatNumber(dialogs.length)} {dialogs.length === 1 ? 'message' : 'messages'}</p>
                </div>
            </div>
            <div class="flex items-center gap-1.5">
                <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-warning/15 text-warning transition-all cursor-pointer hover:scale-105 hover:bg-warning/25"
                    title="Send notification"
                    aria-label="Send notification"
                    onclick={() => handleSendNotification()}
                >
                    <i class="mdi mdi-bell-ring"></i>
                </button>
                <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-info/15 text-info transition-all cursor-pointer hover:scale-105 hover:bg-info/25"
                    title="Go to chat"
                    aria-label="Go to chat"
                    onclick={() => goToChat()}
                >
                    <i class="mdi mdi-chat"></i>
                </button>
            </div>
        </div>
    </div>

    <div class="p-4 sm:p-6">
        <div class="thin-scrollbar max-h-[calc(100vh-22rem)] min-h-[200px] overflow-y-auto pr-2">
            <ul class="dialog-timeline relative m-0 list-none space-y-5 p-0 pl-8">
                {#each dialogs as dialog}
            <li class="relative">
                <!-- Timeline dot -->
                <span class="absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-primary/30 dark:bg-gray-800">
                    <i class="bx bx-right-arrow-circle text-primary text-base leading-none {showInRight(dialog) ? 'bx-fade-right' : ''}"></i>
                </span>
                <div class="rounded-lg border border-gray-100 bg-white p-3 transition-colors hover:border-primary/30 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary/40">
                    <div class="flex items-start gap-3">
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <i class="bx {showInRight(dialog) ? 'bx-user' : 'bx-bot'} text-xl leading-none"></i>
                        </span>
                        <div class="min-w-0 flex-1">
                            <div class="flex flex-wrap items-baseline gap-2">
                                <span class="text-sm font-semibold text-dark dark:text-gray-100">{dialog.sender?.full_name || dialog.sender?.user_name || 'Unknown'}</span>
                                <span class="text-[0.7rem] text-muted">{utcToLocal(dialog.created_at)}</span>
                            </div>
                            <div class="mt-1.5">
                                <ConvDialogElement dialog={dialog} />
                                {#if dialog.has_message_files || dialog.data?.startsWith(IMAGE_DATA_PREFIX)}
                                    <MessageFileGallery
                                        message={dialog}
                                        appendImage
                                        galleryClasses={'dialog-file-display'}
                                        fetchFiles={() => getConversationFiles(conversation.id, dialog.message_id, showInRight(dialog) ? FileSourceType.User : FileSourceType.Bot)}
                                    />
                                {/if}
                            </div>
                            {#if dialog.message_id}
                            <div class="mt-1.5 font-mono text-[0.7rem] text-muted">
                                Message id: {dialog.message_id}
                            </div>
                            {/if}
                        </div>
                    </div>
                </div>
                </li>
                {/each}
            </ul>
        </div>
    </div>
</div>

