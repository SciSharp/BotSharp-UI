<script>
    // This page is used to initialize a new conversation for client
    import { Container, Row, Col } from '@sveltestrap/sveltestrap';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { newConversation } from '$lib/services/conversation-service.js';
    import { getToken, setToken } from '$lib/services/auth-service.js'
    import { getUserStore } from '$lib/helpers/store.js';
    import { conversationStore } from '$lib/helpers/store.js';
	import { LEARNER_AGENT_ID, TRAINING_MODE } from '$lib/helpers/constants';

    const params = $page.params;
    
    /** @type {import('$conversationTypes').ConversationModel} */
    let conversation;
    let conversationId = "undefined";

    let agentId = params.agentId;

    onMount(async () => {
        let user = getUserStore();
        if ($page.url.searchParams.has('token')) {
            let token = $page.url.searchParams.get('token');
            console.log("login as explicit token in query.");
            await setToken(token);
        } else if (user.token) {
            console.log("login as existing account.");
        } else {
            await getToken("guest@gmail.com", "123456", () => {
                console.log("login as guest.");
            }, () => {});
        }

        conversation = conversationStore.get();
        if (!conversation.id || agentId != conversation.agent_id) {
            // new conversation
            conversation = await newConversation(agentId);
            conversationStore.put(conversation);
        }

        conversationId = conversation.id;
        const chatUrl = new URL(`chat/${agentId}/${conversationId}`, window.location.origin);
        
        const searchParams = new URLSearchParams();
        if (agentId === LEARNER_AGENT_ID) {
            searchParams.append('mode', TRAINING_MODE);
        }

        chatUrl.search = searchParams?.toString();
        window.location.href = chatUrl.toString();
    });
</script>

<Container fluid>
    <Row class="text-center">
        <Col style="padding: 50px;">
            <div class="spinner-grow text-primary m-1" role="status" style="padding: 50px;">
                <span class="sr-only">Loading...</span>
            </div>
            <h3>Initializing a conversation, wait a moment please...</h3>
            <a href={`chat/${agentId}/${conversationId}`}>Click here if the browser doesn't redirect correctly.</a>
        </Col>
    </Row>
</Container>