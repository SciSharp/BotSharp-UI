<script>
    import { _ } from 'svelte-i18n';
    import util from "lodash";
    import { getConversationFiles, sendNotification } from '$lib/services/conversation-service.js';
    import { utcToLocal } from '$lib/helpers/datetime';
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
    size={'md'}
    isOpen={isOpenNotificationModal}
    toggleModal={() => toggleNotificationModal()}
    confirm={() => confirmMsg()}
    cancel={() => toggleNotificationModal()}
    confirmBtnText={'Send'}
    disableConfirmBtn={!util.trim(text)}
>
    <textarea
        class="form-control chat-input"
        rows="5"
        maxlength={maxTextLength}
        bind:value={text}
        placeholder="Enter Message..."
    ></textarea>
    <div class="text-secondary text-end text-count">
        <div>{`${(text?.length || 0)}/${maxTextLength}`}</div>
    </div>
</DialogModal>

<div class="card">
    <div class="card-body">
        <div style="display: flex; justify-content: space-between;">
            <div>
                <h4 class="card-title mb-5">{$_('Dialogs')}</h4>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 5px;">
                <div>
                    <button
                        type="button"
                        class="btn btn-soft-warning btn-sm btn-rounded"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Send notification"
                        aria-label="Send notification"
                        onclick={() => handleSendNotification()}
                    >
                        <i class="mdi mdi-bell-ring"></i>
                    </button>
                </div>
                <div>
                    <button
                        type="button"
                        class="btn btn-soft-info btn-sm btn-rounded"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Go to chat"
                        aria-label="Go to chat"
                        onclick={() => goToChat()}
                    >
                        <i class="mdi mdi-chat"></i>
                    </button>
                </div>
            </div>
        </div>
        <div>
            <ul class="verti-timeline list-unstyled">
                {#each dialogs as dialog}
                <li class="event-list">
                    <div class="event-timeline-dot">
                      <i
                        class={"bx " + (showInRight(dialog)
                          ? "bx-right-arrow-circle bx-fade-right"
                          : "bx-right-arrow-circle")}></i>
                    </div>
                    <div class="d-flex" style="gap: 10px;">
                        <div class="flex-shrink-0">
                            <i class={"bx " + (showInRight(dialog) ? "bx-user" : "bx-bot") + " h2 text-primary"}></i>
                        </div>
                        <div class="flex-grow-1" style="min-width: 200px;">
                            <div>
                                <span>{dialog.sender?.full_name || dialog.sender?.user_name || 'Unkown'}</span>
                                <span class="text-muted ms-2" style="font-size: 0.7rem;">{utcToLocal(dialog.created_at)}</span>
                            </div>
                            <div>
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
                            <div>
                                <span class="text-muted" style="font-size: 0.7rem;">{`Message id: ${dialog.message_id}`}</span>
                            </div>
                            {/if}
                        </div>
                    </div>
                  </li>
                {/each}
            </ul>
        </div>
    </div>
</div>