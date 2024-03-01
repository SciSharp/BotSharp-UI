<script>
    import { Card, CardBody, CardTitle, Col, Row } from '@sveltestrap/sveltestrap';
    import Link from 'svelte-link/src/Link.svelte';
    import { GetDialogs } from '$lib/services/conversation-service.js';
    import { utcToLocal } from '$lib/helpers/datetime';
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n'  
	import { USER_SENDERS } from '$lib/helpers/constants';

    /** @type {import('$types').ChatResponseModel[]} */
    let dialogs = [];

    /** @type {import('$types').ConversationModel} */
    export let conversation;

    onMount(async () => {
        dialogs = await GetDialogs(conversation.id);
    });

    /** 
     * @param {import('$types').ChatResponseModel} dialog
     * @returns {boolean}
    */
    function showInRight(dialog) {
        return USER_SENDERS.includes(dialog?.sender?.role || '');
    }

    function directToChat() {
        window.open(`/chat/${conversation.agent_id}/${conversation.id}`);
    }
</script>

<Card>
    <CardBody>
        <div style="display: flex; justify-content: space-between;">
            <div>
                <CardTitle class="mb-5 h4">{$_('Dialogs')}</CardTitle>
            </div>
            <div>
                <Link class="btn btn-soft-info btn-sm btn-rounded" on:click={() => directToChat()}>
                    <i class="mdi mdi-chat" />
                </Link>
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
                    <div class="d-flex">
                        <div class="flex-shrink-0 me-3">
                            <i class={"bx " + (showInRight(dialog) ? "bx-user" : "bx-bot") + " h2 text-primary"}></i>
                        </div>
                        <div class="flex-grow-1">
                            <div>
                                <span>{dialog.sender.full_name}</span>
                                <p class="fw-bold">{dialog.text}</p>
                                <span class="text-muted">{utcToLocal(dialog.created_at)}</span>
                            </div>
                        </div>
                    </div>
                  </li>
                {/each}
            </ul>
        </div>
    </CardBody>
</Card>