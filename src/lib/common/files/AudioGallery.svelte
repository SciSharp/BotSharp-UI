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

<style>
    /* ===== Audio gallery list wrapper =====
       Replaces the legacy `.audio-gallery-list` rule in `_file.scss` that
       was dropped in the Tailwind v4 migration. Selectors are wrapped in
       :global() because the matching DOM is rendered by the third-party
       <AudioPlayer> component below, not by this component's template,
       and Svelte's CSS scoper would otherwise strip the class hashes. */
    :global(.audio-gallery-list) {
        margin: 5px 0;
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        justify-content: flex-start;
        width: inherit;
    }
    :global(.audio-gallery-list .aplayer) {
        margin: 0 !important;
        width: 100%;
    }
</style>
