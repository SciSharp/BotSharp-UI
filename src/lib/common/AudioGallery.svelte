<script>
  import { AUDIO_ICON } from '$lib/helpers/utils/file';
  import { afterUpdate, onMount } from 'svelte';

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


<div
  class="{disableDefaultStyles ? '' : 'audio-gallery-list'} {containerClasses}"
  style={`${containerStyles}`}
>
</div>
