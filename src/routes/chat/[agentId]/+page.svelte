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

<style>
    /* ===== Page shell ===== */
    .ci-page {
        width: 100%;
        padding: 0 1rem;
    }
    .ci-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 3.125rem 1rem;
        gap: 1.25rem;
    }

    /* ===== Spinner (replaces .spinner-grow) =====
       Pulsing primary-tinted dot, accessible (role=status on parent). */
    .ci-spinner {
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        background-color: var(--color-primary);
        animation: ci-pulse 1s ease-in-out infinite;
    }
    @keyframes ci-pulse {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(1);
            opacity: 0;
        }
    }

    /* ===== Visually hidden (replaces .sr-only) ===== */
    .ci-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .ci-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: rgb(55 65 81);
    }
    .ci-link {
        font-size: 0.875rem;
        color: var(--color-primary);
        text-decoration: none;
        transition: color 0.15s ease;
    }
    .ci-link:hover {
        color: var(--color-primary-hover);
        text-decoration: underline;
    }

    /* ===== Dark mode ===== */
    :global(.dark) .ci-title {
        color: rgb(229 231 235);
    }
</style>