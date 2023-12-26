<script>
    import { Card, CardBody, CardTitle, Col, Row } from 'sveltestrap';
    import { GetDialogs } from '$lib/services/conversation-service.js';
    import { format } from '$lib/helpers/datetime';
    import { onMount } from 'svelte';

    /** @type {import('$types').ChatResponseModel[]} */
    let dialogs = [];

    /** @type {string} */
    export let conversationId;

    onMount(async () => {
        dialogs = await GetDialogs(conversationId);
    });
</script>

<Card>
    <CardBody>
        <CardTitle class="mb-5 h4">Dialogs</CardTitle>
        <div class="">
            <ul class="verti-timeline list-unstyled">
                {#each dialogs as dialog}
                <li class="event-list">
                    <div class="event-timeline-dot">
                      <i
                        class={dialog.sender.role === "client"
                          ? "bx bx-right-arrow-circle bx-fade-right"
                          : "bx bx-right-arrow-circle"}
                      />
                    </div>
                    <div class="d-flex">
                        <div class="flex-shrink-0 me-3">
                            <i class={"bx " + (dialog.sender.role == "client" ? "bx-user" : "bx-bot") + " h2 text-primary"}></i>
                        </div>
                        <div class="flex-grow-1">
                            <div>
                                <span>{dialog.sender.full_name}</span>
                                <p class="fw-bold">{dialog.text}</p>
                                <span class="text-muted">{format(dialog.created_at, 'time')}</span>
                            </div>
                        </div>
                    </div>
                  </li>
                {/each}
            </ul>
        </div>
    </CardBody>
</Card>