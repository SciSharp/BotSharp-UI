<script>
	import AudioPlayer from './audio-player/AudioPlayer.svelte';

  /** @type {import('$fileTypes').AudioFileModel[]} */
  export let audios = [];

  /** @type {string} */
  export let id;

  /** @type {string} */
  export let containerClasses = "";

  /** @type {string} */
  export let containerStyles = "";

  /** @type {boolean} */
  export let disableDefaultStyles = false;
</script>


{#if audios?.length > 0}
<div
  class="{disableDefaultStyles ? '' : 'audio-gallery-list'} {containerClasses}"
  style={`${containerStyles}`}
>
  <AudioPlayer id={id} audio={audios} />
</div>
{/if}
