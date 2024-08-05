<script>
	import { initSpeech, stopAll, clearSpeakerInstantce } from "$lib/common/audio-player/store";
	import { onMount, onDestroy } from "svelte";
  import { v4 as uuidv4 } from 'uuid';

  /** @type {string} */
  export let text;

  /** @type {string} */
  export let id = uuidv4();

  /** @type {boolean} */
  export let mutex = true;

  /** @type {string} */
  export let containerClasses = "";

  /** @type {string} */
  export let containerStyles = "";

  /** @type {boolean} */
  export let disableDefaultStyles = false;

  /** @type {boolean} */
  let speaking = false;

  /** @type {import('$types').SpeechModel} */
  let speech;

  onMount(() => {
    const utterThis = new SpeechSynthesisUtterance();
    utterThis.pitch = 1;
    utterThis.rate = 1;
    utterThis.onend = (e) => { stop(); };
    id = id || uuidv4();

    speech = {
      id: id,
      synth: window?.speechSynthesis,
      utterThis: utterThis,
      stop: () => stop(),
      isSpeaking: () => isSpeaking()
    };
    initSpeech(speech);
  });

  /**  @param {string} transcript */
  function utter(transcript) {
    if (mutex) {
      stopAll();
    }

    speaking = true;
    speech.utterThis.text = transcript;
    speech.synth.speak(speech.utterThis);
  }

  function speak() {
    speaking = !speaking;
    if (speaking) {
      utter(text);
    } else {
      speech.synth.cancel();
    }
  }

  const stop = () => {
    speaking = false;
    if (speech?.synth && speech.synth.speaking) {
      speech.synth.cancel();
    }
  }

  const isSpeaking = () => {
    return speaking;
  }

  onDestroy(() => {
    clearSpeakerInstantce(id);
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="{disableDefaultStyles ? '' : 'chat-speaker-container'} {containerClasses}"
  style={`${containerStyles}`}
>
  <span on:click={() => speak()}>
    {#if !speaking}
      <i class="bx bx-volume" />
    {:else}
      <i class="bx bx-volume-full" />
    {/if}
  </span>
</div>