<script>
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { PUBLIC_LIVECHAT_HOST, PUBLIC_LIVECHAT_ENTRY_ICON } from '$env/static/public';
    import { getSettingDetail } from '$lib/services/setting-service';
	import { CHAT_FRAME_ID } from '$lib/helpers/constants';
	import { ChatAction } from '$lib/helpers/enums';
	import BubbleChat from './BubbleChat.svelte';

    let chatUrl = $state(PUBLIC_LIVECHAT_HOST);
    let showChatBox = $state(false);
    let showBubbleMsg = $state(false);
    let receivedMsg = $state('');
    /** @type {number | undefined} */
    let timeout = $state(undefined);

    onMount(async () => {
        const agentSettings = await getSettingDetail("Agent");
        chatUrl = `${PUBLIC_LIVECHAT_HOST}chat/${agentSettings.hostAgentId}`;
    });

    // Handle event from iframe
    window.onmessage = async function(e) {
        if (e.data.action == ChatAction.Close) {
            showChatBox = false;
        } else if (e.data.action == ChatAction.Open) {
            showChatBox = true;
        } else if (e.data.action == ChatAction.ReceiveNotification && !showChatBox) {
            if (timeout) {
                clearTimeout(timeout);
            }

            receivedMsg = e.data?.data?.rich_content?.message?.text || e.data?.data?.text || '';
            showBubbleMsg = true;
            wave();
            timeout = setTimeout(() => {
                showBubbleMsg = false;
                receivedMsg = '';
            }, receivedMsg?.length > 200 ? 8000 : 3000);
        } else if (e.data.action == ChatAction.NewWindow && e.data.url) {
            window.open(e.data.url, '_blank');
        }
    };

    function openChatBox() {
        showChatBox = true;
        receivedMsg = '';
        showBubbleMsg = false;
    }

    function closeBubbleMsg() {
        receivedMsg = '';
        showBubbleMsg = false;
    }

    function wave() {
        const elem = document.getElementById('chatbot-icon');
        if (elem) {
            elem.classList.add('waving');
            setTimeout(() => {
                elem.classList.remove('waving');
            }, 800);
        }
    }
</script>

<div class="chatbot-container float-bottom-right fixed bottom-0 left-0 right-0 z-[1030]">
    {#if showBubbleMsg}
        <div transition:fade={{ delay: 50, duration: 200 }}>
            <BubbleChat text={receivedMsg} close={() => closeBubbleMsg()} />
        </div>
    {/if}

    <iframe
        src={chatUrl}
        width={'380px'}
        height={'650px'}
        class={`m-4 self-end rounded-lg border-2 border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 ${showChatBox ? 'chat-iframe' : 'hidden'}`}
        title="live chat"
        id={CHAT_FRAME_ID}
    >
    </iframe>

    {#if !showChatBox}
        <div
            id="chatbot-icon"
            class="chatbot-icon wave-effect mb-4 self-end"
            transition:fade={{ delay: 50, duration: 200 }}
        >
            <button
                type="button"
                class="chat-icon-btn cursor-pointer rounded-full border-0 bg-transparent p-0 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Open live chat"
                onclick={() => openChatBox()}
            >
                <img alt="live chat" class="h-20 w-20 rounded-full shadow-lg" src={PUBLIC_LIVECHAT_ENTRY_ICON} />
            </button>
        </div>
    {/if}
</div>

<style>
    .wave-effect:hover {
        animation: wave 0.82s cubic-bezier(.36,.07,.19,.97) both;
        transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
        perspective: 1000px;
    }

    .waving {
        animation: wave 0.82s cubic-bezier(.36,.07,.19,.97) both;
        transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
        perspective: 1000px;
    }

    @keyframes wave {
        10%, 90% {
            transform: translate3d(-1px, 0, 0);
        }

        20%, 80% {
            transform: translate3d(2px, 0, 0);
        }

        30%, 50%, 70% {
            transform: translate3d(-4px, 0, 0);
        }

        40%, 60% {
            transform: translate3d(4px, 0, 0);
        }
    }

    .float-bottom-right {
        width: fit-content;
        margin-right: 0px;
        margin-left: auto;
    }

    .chatbot-container {
        display: flex;
        flex-direction: column;
    }

    .chatbot-icon {
        display: flex;
        justify-content: flex-end;
    }

    .chat-icon-btn {
        padding-top: 0px;
    }
</style>