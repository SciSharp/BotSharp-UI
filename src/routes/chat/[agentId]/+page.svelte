<script>
    import { Container, Row, Col } from '@sveltestrap/sveltestrap';

    // This page is used to initialize a new conversation for client
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { newConversation } from '$lib/services/conversation-service.js';
    import { getToken, setToken } from '$lib/services/auth-service.js'
    import { getUserStore } from '$lib/helpers/store.js';
    import { conversationStore, getConversationStore } from '$lib/helpers/store.js';

    const params = $page.params;
    
    /** @type {import('$types').ConversationModel} */
    let conversation;
    let conversationId = "undefined";

    let agentId = params.agentId;

    onMount(async () => {
        let user = getUserStore();
        if (user.token) {
            console.log("login as existing account.");
        } else if($page.url.searchParams.has('token')) {
            let token = $page.url.searchParams.get('token');
            setToken(token);
        } else {
            await getToken("guest@gmail.com", "123456", () => {
                console.log("login as guest.");
            });
        }

        conversation = getConversationStore();
        if (!conversation.id || agentId != conversation.agent_id) {
            // new conversation
            conversation = await newConversation(agentId);
            conversationStore.set(conversation);
        }

        conversationId = conversation.id;
        let chatUrl = `chat/${agentId}/${conversationId}`;
        const isFrame = $page.url.searchParams.get('isFrame');
        if (isFrame === 'true') {
            chatUrl = `${chatUrl}?isFrame=true`
        }
        window.location.href = chatUrl;
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