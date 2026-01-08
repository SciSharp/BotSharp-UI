<script>
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n' 
    import util from "lodash";
    import { Card, CardBody, CardTitle, Col, Row } from '@sveltestrap/sveltestrap';
    import { getConversationFiles, sendNotification } from '$lib/services/conversation-service.js';
    import { utcToLocal } from '$lib/helpers/datetime';
	import { IMAGE_DATA_PREFIX, BOT_SENDERS } from '$lib/helpers/constants';
	import MessageFileGallery from '$lib/common/MessageFileGallery.svelte';
	import { FileSourceType } from '$lib/helpers/enums';
	import DialogModal from '$lib/common/modals/DialogModal.svelte';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
    import ConvDialogElement from './conv-dialog-element.svelte';

    const maxTextLength = 4096;
    const duration = 1500;

    /** @type {boolean} */
    let isOpenNotificationModal = false;
    let isComplete = false;

    /** @type {string} */
    let text = '';

    /** @type {import('$conversationTypes').ConversationModel} */
    export let conversation;

    /** @type {import('$conversationTypes').ChatResponseModel[]} */
    export let dialogs = [];

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
    disableConfirmBtn={!!!util.trim(text)}
>
    <textarea class="form-control chat-input" rows="5" maxlength={maxTextLength} bind:value={text} placeholder="Enter Message..." />
    <div class="text-secondary text-end text-count">
        <div>{`${(text?.length || 0)}/${maxTextLength}`}</div>
    </div>
</DialogModal>

<Card>
    <CardBody>
        <div style="display: flex; justify-content: space-between;">
            <div>
                <CardTitle class="mb-5 h4">{$_('Dialogs')}</CardTitle>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 5px;">
                <div>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div
                        class="btn btn-soft-warning btn-sm btn-rounded"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Send notification"
                        on:click={() => handleSendNotification()}
                    >
                        <i class="mdi mdi-bell-ring" />
                    </div>
                </div>
                <div>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div
                        class="btn btn-soft-info btn-sm btn-rounded"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Go to chat"
                        on:click={() => goToChat()}
                    >
                        <i class="mdi mdi-chat" />
                </div>
                </div>
            </div>
        </div>
        <div class="">
            <ul class="verti-timeline list-unstyled">
                {#each dialogs as dialog}
                <li class="event-list">
                    <div class="event-timeline-dot">
                      <i
                        class={"bx " + showInRight(dialog)
                          ? "bx-right-arrow-circle bx-fade-right"
                          : "bx-right-arrow-circle"}
                      />
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
                                {#if !!dialog.has_message_files || dialog.data?.startsWith(IMAGE_DATA_PREFIX)}
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
    </CardBody>
</Card>