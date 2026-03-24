<script>
	import AudioPlayer from '../audio-player/AudioPlayer.svelte';

  /**
   * @type {{
   *   audios?: import('$fileTypes').AudioFileModel[],
   *   id?: string,
   *   containerClasses?: string,
   *   containerStyles?: string,
   *   disableDefaultStyles?: boolean
   * }}
   */
  let {
    audios = [],
    id = '',
    containerClasses = '',
    containerStyles = '',
    disableDefaultStyles = false
  } = $props();
</script>


{#if audios?.length > 0}
<div
  class="{disableDefaultStyles ? '' : 'audio-gallery-list'} {containerClasses}"
  style={`${containerStyles}`}
>
  <AudioPlayer id={id} audio={audios} />
</div>
{/if}
