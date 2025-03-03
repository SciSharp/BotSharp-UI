<script>
    import { Button, Card, CardBody, CardTitle} from '@sveltestrap/sveltestrap';
    import { utcToLocal } from '$lib/helpers/datetime';
    import { _ } from 'svelte-i18n'

    /** @type {import('$conversationTypes').ConversationModel} */
    export let conversation;
</script>

<Card>
    <CardBody>
        <div class="text-center">
            <!--<img src={adobephotoshop} alt="" height="50" class="mx-auto d-block" />-->
            <h5 class="mt-3 mb-1 ellipsis">{conversation.title}</h5>
            <p class="text-muted mb-0">{utcToLocal(conversation.created_time)}</p>
        </div>

        <ul class="list-unstyled mt-4">
            <li>
                <div class="d-flex">
                    <i class="bx bx-phone text-primary fs-4"></i>
                    <div class="ms-3">
                        <h6 class="fs-14 mb-2">{$_('Channel')}</h6>
                        <p class="text-muted fs-14 mb-0">{conversation.channel}</p>
                    </div>
                </div>
            </li>
            <li class="mt-3">
                <div class="d-flex">
                    <i class="bx bx-mail-send text-primary fs-4"></i>
                    <div class="ms-3">
                        <h6 class="fs-14 mb-2">{$_('User')}</h6>
                        <p class="text-muted fs-14 mb-0">{conversation.user.full_name}</p>
                    </div>
                </div>
            </li>
            <li class="mt-3">
                <div class="d-flex">
                    <i class="bx bx-globe text-primary fs-4"></i>
                    <div class="ms-3">
                        <h6 class="fs-14 mb-2">{$_('Status')}</h6>
                        <p class="text-muted fs-14 text-break mb-0">{conversation.status}</p>
                    </div>
                </div>
            </li>
            <li class="mt-3">
                <div class="d-flex">
                    <i class="bx bx-map text-primary fs-4"></i>
                    <div class="ms-3">
                        <h6 class="fs-14 mb-2">{$_('Location')}</h6>
                        <p class="text-muted fs-14 mb-0">Oakridge Lane Richardson.</p>
                    </div>
                </div>
            </li>
            {#if conversation.tags?.length > 0}
            <li class="mt-3">
                <div class="d-flex">
                    <i class="bx bx-tag text-primary fs-4"></i>
                    <div class="ms-3">
                        <h6 class="fs-14 mb-2">{$_('Tags')}</h6>
                        <ul style="padding-left: 1rem;">
                            {#each conversation.tags as tag}
                                <li class="text-muted fs-14 mb-0">{tag}</li>
                            {/each}
                        </ul>
                    </div>
                </div>
            </li>
            {/if}
        </ul>
    </CardBody>
</Card>