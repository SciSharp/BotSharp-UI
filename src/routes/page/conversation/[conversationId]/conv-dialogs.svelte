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
                    class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-warning/15 text-warning transition-all hover:scale-105 hover:bg-warning/25"
                    title="Send notification"
                    aria-label="Send notification"
                    onclick={() => handleSendNotification()}
                >
                    <i class="mdi mdi-bell-ring"></i>
                </button>
                <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-info/15 text-info transition-all hover:scale-105 hover:bg-info/25"
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

<style>
    /* Vertical line behind the timeline dots */
    .dialog-timeline::before {
        content: '';
        position: absolute;
        left: -1.5rem;
        top: 0.5rem;
        bottom: 0.5rem;
        width: 2px;
        background-color: rgb(229 231 235);
    }
    :global(.dark) .dialog-timeline::before {
        background-color: rgb(55 65 81);
    }

    /* ---------- Notification modal form ----------
       Themed textarea + character counter that match the DialogModal's
       primary-accented panel. Replaces Bootstrap `form-control`,
       `chat-input`, `text-secondary`, `text-end`, and the legacy global
       `.text-count` rule with scoped styles owned by this component. */
    .notif-form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .notif-label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--color-muted);
        margin: 0;
    }

    .notif-textarea {
        width: 100%;
        padding: 0.75rem 0.875rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.5rem;
        background-color: rgb(249 250 251);
        font-size: 0.875rem;
        line-height: 1.55;
        color: rgb(17 24 39);
        resize: vertical;
        min-height: 7.5rem;
        max-height: 16rem;
        scrollbar-width: thin;
        font-family: inherit;
        transition:
            border-color 0.15s ease,
            background-color 0.15s ease,
            box-shadow 0.15s ease;
    }
    .notif-textarea::placeholder {
        color: var(--color-muted);
        opacity: 1;
    }
    .notif-textarea:hover:not(:focus) {
        border-color: rgb(209 213 219);
    }
    .notif-textarea:focus {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }

    /* Character counter — sits below the textarea, right-aligned, with
       a subtle counter icon. Switches to warning tint when the user is
       past 80% of the limit. */
    .notif-counter {
        align-self: flex-end;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.6875rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        color: var(--color-muted);
        transition: color 0.15s ease;
    }
    .notif-counter :global(i) {
        font-size: 0.875rem;
        line-height: 1;
    }
    .notif-counter-warning {
        color: var(--color-warning);
    }

    /* Dark-mode adjustments to keep contrast inside the DialogModal panel. */
    :global(.dark) .notif-textarea {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(243 244 246);
    }
    :global(.dark) .notif-textarea:focus {
        background-color: rgb(31 41 55);
    }
</style>