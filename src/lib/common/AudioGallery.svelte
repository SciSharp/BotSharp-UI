<script>
  import { AUDIO_ICON } from '$lib/helpers/utils/file';
  import { afterUpdate, onMount } from 'svelte';
	import AudioPlayer from './audio-player/AudioPlayer.svelte';

  /** @type {any[]} */
  export let files = [];

  /** @type {string} */
  export let containerClasses = "";

  /** @type {string} */
  export let containerStyles = "";

  /** @type {boolean} */
  export let disableDefaultStyles = false;

  /** @type {any[]} */
  let audios = [];

  afterUpdate(() => {
    if (files?.length > 0) {
      audios = files.map(file => {
        return {
          name: file.file_name,
          artist: '',
          cover: file.file_cover || AUDIO_ICON,
          url: file.file_data
        };
      });
    }
  });

</script>


{#if audios?.length > 0}
<div
  class="{disableDefaultStyles ? '' : 'audio-gallery-list'} {containerClasses}"
  style={`${containerStyles}`}
>
  <AudioPlayer mutex audio={audios} />
</div>
{/if}
