<script>
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { PUBLIC_LIVECHAT_HOST, PUBLIC_LIVECHAT_ENTRY_ICON } from '$env/static/public';
    import { getSettingDetail } from '$lib/services/setting-service';

    let showChatIcon = false;
    let showChatBox = false;
    let chatUrl = PUBLIC_LIVECHAT_HOST;

	onMount(async () => {
    const agentSettings = await getSettingDetail("Agent");
    chatUrl = `${PUBLIC_LIVECHAT_HOST}/chat/${agentSettings.hostAgentId}`;
    showChatIcon = true;
	});

  // Handle event from iframe
  window.onmessage = async function(e) {
    if (e.data.action == 'close') {
      showChatIcon = true;
      showChatBox = false;
    }
  };

  function handleChatBox() {
    showChatIcon = false;
    showChatBox = true;
  }
</script>

<div class="fixed-bottom float-bottom-right">
    {#if showChatBox}
    <div transition:fade={{ delay: 250, duration: 300 }}>
      <iframe
        src={chatUrl}
        width="380px" 
        height="650px" 
        class="border border-2 rounded-3 m-3 float-end"
        title="live chat"
      >
      </iframe>
    </div>
    {/if}

    {#if showChatIcon}
    <div class="mb-3 float-end wave-effect" transition:fade={{ delay: 100, duration: 500 }}>
      <button class="btn btn-transparent" on:click={handleChatBox}>
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
</style>