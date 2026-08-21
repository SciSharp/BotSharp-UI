<script>
    // This page is used to initialize a new conversation for client
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { newConversation } from '$lib/services/conversation-service.js';
    import { getToken, setToken } from '$lib/services/auth-service.js';
    import { getUserStore } from '$lib/helpers/store.js';
    import { conversationStore } from '$lib/helpers/store.js';
    import { LEARNER_AGENT_ID, TRAINING_MODE } from '$lib/helpers/constants';

    /** @type {import('$conversationTypes').ConversationModel} */
    let conversation = $state(/** @type {any} */ (undefined));
    let conversationId = $state('undefined');

    let agentId = $derived(page.params.agentId);

    onMount(async () => {
        let user = getUserStore();
        if (page.url.searchParams.has('token')) {
            let token = page.url.searchParams.get('token');
            console.log("login as explicit token in query.");
            await setToken(token || '');
        } else if (user.token) {
            console.log("login as existing account.");
        } else {
            await getToken("guest@gmail.com", "123456", '', () => {
                console.log("login as guest.");
            }, () => {});
        }

        conversation = conversationStore.get();
        if (!conversation.id || agentId != conversation.agent_id) {
            // @ts-ignore
            conversation = await newConversation(agentId);
            conversationStore.put(conversation);
        }

        conversationId = conversation.id;
        const path = `chat/${agentId}/${conversationId}`;

        const searchParams = new URLSearchParams();
        if (agentId === LEARNER_AGENT_ID) {
            searchParams.append('mode', TRAINING_MODE);
        }

        const search = searchParams?.toString();
        const url = search ? `${path}?${search}` : path;
        goto(url);
    });
</script>

<div class="ci-page">
    <div class="ci-content">
        <div class="ci-spinner" role="status">
            <span class="ci-sr-only">Loading...</span>
        </div>
        <h3 class="ci-title">Initializing a conversation, wait a moment please...</h3>
        <a class="ci-link" href={`chat/${agentId}/${conversationId}`}>
            Click here if the browser doesn't redirect correctly.
        </a>
    </div>
</div>

