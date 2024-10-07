<script>
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { PUBLIC_LIVECHAT_HOST, PUBLIC_LIVECHAT_ENTRY_ICON } from '$env/static/public';
    import { getSettingDetail } from '$lib/services/setting-service';
	import { CHAT_FRAME_ID } from '$lib/helpers/constants';
	import { ChatAction } from '$lib/helpers/enums';
	import BubbleChat from './BubbleChat.svelte';

    let chatUrl = PUBLIC_LIVECHAT_HOST;
    let showChatBox = false;
    let showBubbleMsg = false;
    let receivedMsg = '';
    /** @type {number | undefined} */
    let timeout;

    onMount(async () => {
        const agentSettings = await getSettingDetail("Agent");
        chatUrl = `${PUBLIC_LIVECHAT_HOST}chat/${agentSettings.hostAgentId}`;
    });

    // Handle event from iframe
    window.onmessage = async function(e) {
        if (e.data.action == ChatAction.Close) {
            showChatBox = false;
        } else if (e.data.action == ChatAction.Open) {
            // showChatBox = true;
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

<div class="chatbot-container fixed-bottom float-bottom-right">
    {#if showBubbleMsg}
        <div transition:fade={{ delay: 50, duration: 200 }}>
            <BubbleChat text={receivedMsg} close={() => closeBubbleMsg()} />
        </div>
    {/if}

    <iframe
        src={chatUrl}
        width={'380px'} 
        height={'650px'}
        class={`border border-2 rounded-3 m-3 float-end ${showChatBox ? 'chat-iframe' : 'hide'}`}
        title="live chat"
        id={CHAT_FRAME_ID}
    />

    {#if !showChatBox}
        <div
            id="chatbot-icon"
            class="chatbot-icon mb-3 float-end wave-effect"
            transition:fade={{ delay: 50, duration: 200 }}
        >
            <button class="btn btn-transparent chat-icon-btn" on:click={() => openChatBox()}>
                <img alt="live chat" class="avatar-md rounded-circle" src={PUBLIC_LIVECHAT_ENTRY_ICON} />
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