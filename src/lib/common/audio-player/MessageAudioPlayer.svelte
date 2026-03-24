<script>
	import { stopAll, initAudio, clearAudioInstantce } from "$lib/common/audio-player/store";
	import { onMount, onDestroy } from "svelte";
  import { v4 as uuidv4 } from 'uuid';
	import Stretch from "../shared/Stretch.svelte";

  /**
   * @type {{
   *   id?: string,
   *   volume?: number,
   *   mutex?: boolean,
   *   containerClasses?: string,
   *   containerStyles?: string,
   *   disableDefaultStyles?: boolean,
   *   ondispatch?: (name: string, detail?: any) => void,
   *   ondestroy?: () => void
   * }}
   */
  let {
    id = uuidv4(),
    volume = 0.7,
    mutex = true,
    containerClasses = '',
    containerStyles = '',
    disableDefaultStyles = false,
    ondispatch = () => {},
    ondestroy = () => {}
  } = $props();

  /**
   * @param {string} name
   * @param {any?} detail
   */
  function dispatch(name, detail = null) {
    ondispatch(name, detail);
  }

  /** @type {HTMLAudioElement} */
  let player;

  /** @type {boolean} */
  let speaking = $state(false);

  onMount(() => {
    player = init();

    player.addEventListener("ended", () => {
      stop();
    });
  });

  const init = () => {
    const audioPlayer = document.createElement("audio");
    id = id || uuidv4();
    initAudio({
      id: id,
      player: audioPlayer,
      stop: () => stop()
    }, dispatch);
    audioPlayer.volume = Math.min(Math.max(volume, 0), 1);
    // temp
    audioPlayer.src = "https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/intromusic.ogg";
    return audioPlayer;
  }

  function play() {
    if (mutex) {
      stopAll();
    }

    if (player) {
      speaking = true;
      setTimeout(() => {
        player.play().catch((err) => {
          console.error(err);
        });
      }, 350);
    }
  }

  function speak() {
    speaking = !speaking;
    if (speaking) {
      play();
    } else {
      stop();
    }
  }

  function stop() {
    speaking = false;
    if (player) {
      player.pause();
      player.currentTime = 0;
    }
  }

  onDestroy(() => {
    clearAudioInstantce(id);
    ondestroy();
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="{disableDefaultStyles ? '' : 'chat-speaker-container'} {containerClasses}"
  style={`${containerStyles}`}
>
  <span style="display: inline-block;" onclick={() => speak()}>
    {#if !speaking}
      <i class="bx bx-volume-full"></i>
    {:else}
      <Stretch unit='px' size='5' gap='5' color="var(--bs-primary)" />
    {/if}
  </span>
</div>