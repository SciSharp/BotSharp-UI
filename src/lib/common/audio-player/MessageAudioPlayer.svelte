<script>
	import { stopAll, initAudio, clearAudioInstantce } from "$lib/common/audio-player/store";
	import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { v4 as uuidv4 } from 'uuid';
	import Stretch from "../Stretch.svelte";

  const svelteDispatch = createEventDispatcher();

  /**
   * @param {string} name
   * @param {any?} detail
   */
  function dispatch(name, detail = null) {
    svelteDispatch(name, detail);
  };

  /** @type {string} */
  export let id = uuidv4();

  /** @type {number} */
  export let volume = 0.7;

  /** @type {boolean} */
  export let mutex = true;

  /** @type {string} */
  export let containerClasses = "";

  /** @type {string} */
  export let containerStyles = "";

  /** @type {boolean} */
  export let disableDefaultStyles = false;


  /** @type {HTMLAudioElement} */
  let player;

  /** @type {boolean} */
  let speaking = false;

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
    dispatch("destroy");
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="{disableDefaultStyles ? '' : 'chat-speaker-container'} {containerClasses}"
  style={`${containerStyles}`}
>
  <span style="display: inline-block;" on:click={() => speak()}>
    {#if !speaking}
      <i class="bx bx-volume-full" />
    {:else}
      <Stretch unit='px' size='5' gap='5' color="var(--bs-primary)" />
    {/if}
  </span>
</div>