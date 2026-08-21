<script>
  import {
    initAudio,
    stopAll,
    clearAudioInstantce,
    useAudioStore
  } from "./store";
  import { volumeEventHandlers, progressEventHandlers } from "./handlers";
  import { onDestroy, onMount } from "svelte";
  import { v4 as uuidv4 } from 'uuid';

  import {
    soundUnmuted,
    soundMuted,
    randomOrder,
    loadingIcon,
    listOrder,
    loopOne,
    loopAll,
    loopNone,
  } from "./svg";

  /**
   * @type {{
   *   audio: import('$fileTypes').AudioFileModel[],
   *   id?: string,
   *   order?: "list" | "random",
   *   loop?: "none" | "all" | "one",
   *   volume?: number,
   *   mini?: boolean,
   *   mutex?: boolean,
   *   theme?: string,
   *   listMaxHeight?: number,
   *   playDelay?: number,
   *   autoPlayNextOnClick?: boolean,
   *   baseFontSize?: string,
   *   list_folded?: boolean | string | null,
   *   ondispatch?: (name: string, detail?: any) => void,
   *   ondestroy?: () => void
   * }}
   */
  let {
    audio,
    id = uuidv4(),
    order = 'list',
    loop = 'all',
    volume = 0.7,
    mini = false,
    mutex = true,
    theme = "#fadfa3",
    listMaxHeight = Infinity,
    playDelay = 300,
    autoPlayNextOnClick = true,
    baseFontSize = "12px",
    list_folded = undefined,
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

  const {
    playList,
    audioList,
    currentSong,
    currentTime,
    duration,
    rdTime,
    rdBufTime,
    wtBufTime,
  // eslint-disable-next-line -- audio is intentionally captured as initial value; $effect keeps it in sync
  } = useAudioStore(dispatch, audio);

  /** @type {HTMLElement} */
  let volumeBar;

  /** @type {HTMLElement} */
  let playedBar;

  /** @type {() => void} */
  let volumeDragStart = $state(() => {});

  /** @type {(ev: any) => void} */
  let volumeDragMove = $state(() => {});

  /** @type {(ev: any) => void} */
  let volumeDragEnd = $state(() => {});

  /** @type {() => void} */
  let progressDragStart = $state(() => {});

  /** @type {(ev: any) => void} */
  let progressDragMove = $state(() => {});

  /** @type {(ev: any) => void} */
  let progressDragEnd = $state(() => {});

  /** @type {() => void} */
  let toggleVolumeMute = $state(() => {});

  /** @type {HTMLElement} */
  let playListElement;

  /** @type {HTMLElement} */
  let rootEl;

  /** @type {HTMLAudioElement} */
  let player;

  /** @type {boolean} */
  let isShowList = $state(false);

  /** @type {boolean} */
  let paused = $state(true);

  /** @type {boolean} */
  let muted = $state(false);

  /** @type {number} */
  let playerListHeight = $state(0);

  let volumePercentage = $derived(muted ? '0%' : `${volume * 100}%`);
  let themeColor = $derived($currentSong?.theme ?? theme);

  onMount(() => {
    player = init();
    const volumeHandlers = volumeEventHandlers(player, volumeBar);
    volumeDragStart = volumeHandlers.volumeDragStart;
    volumeDragMove = volumeHandlers.volumeDragMove;
    volumeDragEnd = volumeHandlers.volumeDragEnd;
    toggleVolumeMute = volumeHandlers.toggleVolumeMute;
    const progressHandlers = progressEventHandlers(player, playedBar);
    progressDragStart = progressHandlers.progressDragStart;
    progressDragMove = progressHandlers.progressDragMove;
    progressDragEnd = progressHandlers.progressDragEnd;

    playListElement?.addEventListener("transitionend", () => {
      playerListHeight = Math.min(playListElement?.scrollHeight ?? 0, listMaxHeight);
    });

    player.addEventListener("play", () => {
      paused = false;
    });
    player.addEventListener("pause", () => {
      paused = true;
    });

    player.addEventListener("timeupdate", () => {
      $currentTime = player.currentTime;
    });

    player.addEventListener("volumechange", () => {
      volume = player.volume;
    });
    player.addEventListener("loadedmetadata", () => {
      $duration = player.duration;
    });

    player.addEventListener("error", () => {
      console.warn("An audio error has occurred, player will skip forward in 2 seconds.");
      if ($audioList.length > 1) {
        setTimeout(() => {
          $playList.playingIndex = ($playList.playingIndex + 1) % $audioList.length;
            if (player.paused) {
              play();
            }
        }, 2000);
      }
    });

    const setBufTime = () => {
      const bufTime = player.buffered.length ? player.buffered.end(player.buffered.length - 1) : 0;
      $wtBufTime = bufTime;
    };

    player.addEventListener("progress", () => {
      setBufTime();
    });
    player.addEventListener("canplay", () => {
      setBufTime();
    });
    player.addEventListener("durationchange", () => {
      $duration = player.duration;
    });

    player.addEventListener("ended", () => {
      jumpNext();
    });
  });

  onDestroy(() => {
    clearAudioInstantce(id);
    ondestroy();
  });

  const init = () => {
    const audioPlayer = document.createElement("audio");
    id = id || uuidv4();
    initAudio({
      id: id,
      player: audioPlayer,
      stop: () => player?.pause()
    }, dispatch);
    const isFolded = !(list_folded === null || list_folded === undefined || list_folded === "false");
    isShowList = !isFolded && $audioList.length > 1;
    audioPlayer.volume = Math.min(Math.max(volume, 0), 1);
    return audioPlayer;
  }

  $effect(() => {
    $playList.audio = audio;
  });

  $effect(() => {
    if (player && $currentSong?.url) {
      player.src = $currentSong.url;
    }
  });

  $effect(() => {
    if (rootEl) {
      rootEl.style.setProperty("--theme-color", themeColor);
      rootEl.style.setProperty("--base-font-size", baseFontSize);
    }
  });

  // Bootstrap playerListHeight whenever the list is shown.
  // The original transitionend listener in onMount only updates the height
  // after a real height transition runs — but with playerListHeight=0
  // initially, the very first toggle goes 0 → 0 and no transition fires,
  // so the list would stay invisible forever. Read scrollHeight directly
  // here; it reports the natural content height even while overflow is
  // clipped and the visible height is 0.
  $effect(() => {
    // Reading $audioList here registers it as a dependency so the height
    // also recomputes when the playlist contents change (e.g. tracks
    // added or removed after mount), not just on isShowList flips.
    if (isShowList && playListElement && $audioList.length > 0) {
      playerListHeight = Math.min(playListElement.scrollHeight, listMaxHeight);
    }
  });

  const play = () => {
    if (mutex) {
      stopAll();
    }

    if (player) {
      setTimeout(() => {
        player.play().catch((err) => {
          console.error(err);
        });
      }, 350);
    }
  };

  const jumpNext = () => {
    const audios = $audioList;
    const nextIdx = ($playList.playingIndex + 1) % audios.length;
    if (loop === "none") {
      if (order === "list") {
        if ($playList.playingIndex < audios.length - 1) {
          const promise = buildNextAudioPromise(nextIdx);
          promise.then(() => play());
        } else {
          $playList.playingIndex = ($playList.playingIndex + 1) % audios.length;
          player.src = $currentSong.url;
          player.pause();
        }
      } else if (order === "random") {
        const randomIdx = Math.floor(audios.length * Math.random());
        let targetIdx = 0;
        if (randomIdx === $playList.playingIndex) {
          targetIdx = nextIdx;
        } else {
          targetIdx = randomIdx;
        }
        const promise = buildNextAudioPromise(targetIdx);
        promise.then(() => play());
      }
    } else if (loop === "one") {
      player.currentTime = 0;
    } else if (loop === "all") {
      const promise = buildNextAudioPromise(nextIdx);
      promise.then(() => play());
    }
  };

  /**
   * @param {number} idx
   */
  function buildNextAudioPromise(idx) {
    return new Promise((/** @type {any} */ resolve) => {
      $playList.playingIndex = idx;
      player.currentTime = 0;
      player.src = $currentSong.url;
      player.pause();
      player.load();
      setTimeout(() => {
        resolve();
      }, playDelay > 0 ? playDelay : 0);
    });
  }

  /**
   * @param {number} idx
   */
  function switchAudio(idx) {
    const promise = buildNextAudioPromise(idx);
    if (autoPlayNextOnClick) {
      promise.then(() => {
        play();
      });
    }
  }

  function clickOrder() {
    order = order === "list" ? "random" : "list";
  }

  function clickLoop() {
    if (loop === "all") {
      loop = "one";
    } else if (loop === "one") {
      loop = "none";
    } else if (loop === "none") {
      loop = "all";
    }
  }

  function toggleList() {
    isShowList = !isShowList;
    isShowList ? dispatch("listshow") : dispatch("listhide");
  }
</script>

<div
  bind:this={rootEl}
  class="aplayer"
  class:aplayer-withlist={$audioList.length > 1}
  class:aplayer-narrow={mini}
>
  <div class="aplayer-body ">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="aplayer-pic"
      style="background-image: url( {$currentSong?.cover} )"
      onclick={() => {
        player?.paused ? play() : player.pause();
      }}
    >
      {#if !paused}
      <div class="aplayer-button aplayer-pause">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          viewBox="0 0 17 32"
        >
          <path
            d="M14.080 4.8q2.88 0 2.88 2.048v18.24q0 2.112-2.88 2.112t-2.88-2.112v-18.24q0-2.048 2.88-2.048zM2.88 4.8q2.88 0 2.88 2.048v18.24q0 2.112-2.88 2.112t-2.88-2.112v-18.24q0-2.048 2.88-2.048z"
          />
        </svg>
      </div>
      {:else}
      <div class="aplayer-button aplayer-play">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          viewBox="0 0 16 31"
        >
          <path
            d="M15.552 15.168q0.448 0.32 0.448 0.832 0 0.448-0.448 0.768l-13.696 8.512q-0.768 0.512-1.312 0.192t-0.544-1.28v-16.448q0-0.96 0.544-1.28t1.312 0.192z"
          />
        </svg>
      </div>
      {/if}
    </div>

    <div class="aplayer-info">
      <div class="aplayer-music">
        <span class="aplayer-title">{$currentSong?.name || ''}</span>
        <span class="aplayer-artist">{$currentSong?.artist || ''}</span>
      </div>

      <div class="aplayer-controller">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="aplayer-bar-wrap"
          bind:this={playedBar}
          onmousedown={progressDragStart}
          onmousemove={progressDragMove}
          onmouseup={progressDragEnd}
          onmouseleave={progressDragEnd}
          ontouchstart={progressDragStart}
          ontouchmove={progressDragMove}
          ontouchend={progressDragEnd}
        >
          <div class="aplayer-bar">
            <div
              class="aplayer-loaded"
              style="width: {$rdBufTime.bufferPercentage}"
            ></div>
            <div class="aplayer-played" style="width: {$rdTime.playPercentage}">
              <div class="aplayer-thumb">
                <span
                  class="aplayer-loading-icon"
                  style="display: none"
                >
                  {@html loadingIcon}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="aplayer-time">
          <span class="aplayer-time-inner">
            <span class="aplayer-ptime">{$rdTime.ptime}</span> /
            <span class="aplayer-dtime">{$rdTime.duration}</span>
          </span>

          <div class="aplayer-volume-wrap">
            <button
              type="button"
              class="aplayer-icon aplayer-icon-volume-down"
              aria-label="Toggle mute"
              onclickcapture={() => {
                muted = !muted;
                toggleVolumeMute();
              }}
            >
              {#if muted || player?.muted}
                {@html soundMuted}
              {:else}
                {@html soundUnmuted}
              {/if}
            </button>
              <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="aplayer-volume-bar-wrap"
              onmousedown={volumeDragStart}
              onmousemove={volumeDragMove}
              onmouseup={volumeDragEnd}
              onmouseleave={volumeDragEnd}
              ontouchstart={volumeDragStart}
              ontouchmove={volumeDragMove}
              ontouchend={volumeDragEnd}
            >
              <div class="aplayer-volume-bar" bind:this={volumeBar}>
                <div
                  class="aplayer-volume"
                  style="height: {player?.muted ? '0px' : volumePercentage}"
                ></div>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="aplayer-icon aplayer-icon-order"
            aria-label="Toggle order"
            onclick={() => clickOrder()}
          >
            {#if order === "random"}
              {@html randomOrder}
            {:else}
              {@html listOrder}
            {/if}
          </button>
          <button
            type="button"
            class="aplayer-icon aplayer-icon-loop"
            aria-label="Toggle loop"
            onclick={() => clickLoop()}
          >
            {#if loop === "none"}
              {@html loopNone}
            {:else if loop === "one"}
              {@html loopOne}
            {:else if loop === "all"}
              {@html loopAll}
            {/if}
          </button>

          {#if $audioList.length > 1}
          <button
            type="button"
            class="aplayer-icon aplayer-icon-menu"
            aria-label="Toggle playlist"
            onclick={() => toggleList()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              version="1.1"
              viewBox="0 0 22 32"
            >
              <path
                d="M20.8 14.4q0.704 0 1.152 0.48t0.448 1.12-0.48 1.12-1.12 0.48h-19.2q-0.64 0-1.12-0.48t-0.48-1.12 0.448-1.12 1.152-0.48h19.2zM1.6 11.2q-0.64 0-1.12-0.48t-0.48-1.12 0.448-1.12 1.152-0.48h19.2q0.704 0 1.152 0.48t0.448 1.12-0.48 1.12-1.12 0.48h-19.2zM20.8 20.8q0.704 0 1.152 0.48t0.448 1.12-0.48 1.12-1.12 0.48h-19.2q-0.64 0-1.12-0.48t-0.48-1.12 0.448-1.12 1.152-0.48h19.2z"
              />
            </svg>
          </button>
          {/if}
        </div>
      </div>
    </div>

    <div
      class="aplayer-list"
      style="height: {isShowList ? `${playerListHeight}px` : '0px'}"
      bind:this={playListElement}
    >
      <ol>
        {#each $audioList as song, idx}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <li onclick={() => switchAudio(idx) }>
          {#if idx === $playList.playingIndex}
            <span class="aplayer-list-cur" ></span>
          {/if}
            <span class="aplayer-list-index">{idx + 1}</span>
            <span class="aplayer-list-title">{song.name}</span>
            <span class="aplayer-list-artist">{song.artist}</span>
          </li>
        {/each}
      </ol>
    </div>
  </div>
</div>

<style>
    /* ===== Audio player =====
       Self-contained port of the legacy `_audio.scss` rules into a scoped
       Svelte <style>. Replaces the SCSS bundle entries dropped in the
       Tailwind v4 migration. Class names on every targeted node are
       static and live in this component's template, so Svelte's scoper
       handles them without :global(). Theme accent is supplied at
       runtime via the inline `--theme-color` CSS variable (see the
       $effect block in <script>). */

    .aplayer {
        --base-font-size: 12px;
        --aplayer-height: calc(var(--base-font-size) * 5.5);
        --theme-color: #fadfa3;
        position: relative;
        background: #fff;
        box-shadow:
            0 2px 2px 0 rgb(0 0 0 / 0.07),
            0 1px 5px 0 rgb(0 0 0 / 0.1);
        font-family: Arial, Helvetica, sans-serif;
        overflow: hidden;
        border-radius: 4px;
        user-select: none;
        line-height: normal;
    }
    .aplayer :global(svg) {
        width: 100%;
        height: 100%;
    }
    .aplayer :global(svg path) {
        fill: #fff;
    }

    /* ----- Icons (volume / order / loop / menu) ----- */
    .aplayer-icon {
        width: calc(var(--base-font-size) + 3px);
        height: calc(var(--base-font-size) + 3px);
        border: none;
        background-color: transparent;
        outline: none;
        cursor: pointer;
        opacity: 0.8;
        vertical-align: middle;
        padding: 0;
        font-size: var(--base-font-size);
        margin: 0;
        display: inline-block;
        transition: opacity 0.15s ease;
    }
    .aplayer-icon:hover {
        opacity: 1;
    }
    .aplayer-icon :global(path) {
        transition: fill 0.2s ease-in-out;
    }

    /* ----- Cover / play-pause button ----- */
    .aplayer-pic {
        position: relative;
        float: left;
        height: var(--aplayer-height);
        width: var(--aplayer-height);
        background-color: antiquewhite;
        background-size: cover;
        background-position: center;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: filter 0.3s ease;
        cursor: pointer;
    }
    .aplayer-pic:hover .aplayer-button {
        opacity: 1;
    }
    .aplayer-button {
        position: absolute;
        border-radius: 50%;
        opacity: 0.8;
        text-shadow: 0 1px 1px rgb(0 0 0 / 0.2);
        box-shadow: 0 1px 1px rgb(0 0 0 / 0.2);
        background: rgb(0 0 0 / 0.35);
        transition: opacity 0.15s ease, background-color 0.15s ease;
    }
    .aplayer-play,
    .aplayer-pause {
        width: 26px;
        height: 26px;
    }
    .aplayer-play :global(svg),
    .aplayer-pause :global(svg) {
        position: absolute;
        top: 3px;
        left: 4px;
        height: 20px;
        width: 20px;
    }

    /* ----- Info panel (title / artist / controller) ----- */
    .aplayer-info {
        margin-left: var(--aplayer-height);
        height: var(--aplayer-height);
        padding: 14px 7px 0 10px;
        box-sizing: border-box;
    }
    .aplayer-music {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        user-select: text;
        margin: 0 0 calc(var(--base-font-size) + 1px) 5px;
        padding-bottom: 2px;
        cursor: default;
    }
    .aplayer-title {
        font-size: calc(var(--base-font-size) + 2px);
        color: #333;
    }
    .aplayer-artist {
        font-size: var(--base-font-size);
        color: #666;
    }

    .aplayer-controller {
        display: flex;
        position: relative;
        align-items: center;
    }

    /* ----- Progress bar ----- */
    .aplayer-bar-wrap {
        flex: 1;
        margin: 0 0 0 5px;
        padding: 4px 0;
        cursor: pointer !important;
    }
    .aplayer-bar-wrap:hover .aplayer-bar .aplayer-played .aplayer-thumb {
        transform: scale(1);
    }
    .aplayer-bar {
        position: relative;
        height: 2px;
        width: 100%;
        background: #cdcdcd;
    }
    .aplayer-loaded {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        background: #aaa;
        height: 2px;
        transition: width 0.5s ease;
    }
    .aplayer-played {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        height: 2px;
        background: var(--theme-color) none repeat scroll 0 0;
    }
    .aplayer-thumb {
        position: absolute;
        top: 0;
        right: 5px;
        margin-top: -4px;
        margin-right: -10px;
        height: 10px;
        width: 10px;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.2s ease-in-out;
        background: var(--theme-color) none repeat scroll 0 0;
        transform: scale(0);
    }
    .aplayer-loading-icon :global(svg) {
        display: block;
        position: absolute;
        animation: aplayer-rotate 1s linear infinite;
    }

    /* ----- Time + control cluster ----- */
    .aplayer-time {
        position: relative;
        right: 0;
        bottom: 4px;
        height: calc(var(--base-font-size) + 5px);
        color: #999;
        font-size: 11px;
        padding-left: 7px;
    }
    .aplayer-time-inner {
        vertical-align: middle;
    }
    .aplayer-time .aplayer-icon {
        cursor: pointer;
        transition: opacity 0.15s ease;
    }
    .aplayer-time .aplayer-icon :global(path) {
        fill: #666;
    }

    /* ----- Volume slider ----- */
    .aplayer-volume-wrap {
        display: inline-block;
        position: relative;
        margin-left: 3px;
        cursor: pointer;
    }
    .aplayer-volume-wrap:hover .aplayer-volume-bar-wrap {
        height: 40px;
    }
    .aplayer-volume-bar-wrap {
        position: absolute;
        bottom: 15px;
        right: -3px;
        width: 25px;
        height: 0;
        z-index: 99;
        overflow: hidden;
        transition: height 0.2s ease-in-out;
    }
    .aplayer-volume-bar {
        position: absolute;
        bottom: 0;
        right: 10px;
        width: 5px;
        height: 35px;
        background: #aaa;
        border-radius: 2.5px;
        overflow: hidden;
    }
    .aplayer-volume {
        background: var(--theme-color) none repeat scroll 0 0;
        position: absolute;
        bottom: 0;
        right: 0;
        width: 5px;
        transition: height 0.1s ease;
    }

    /* ----- Playlist ----- */
    .aplayer-list {
        scrollbar-width: none;
        transition: height 0.3s ease;
        will-change: height;
        display: none;
        overflow: hidden;
        list-style-type: none;
        margin: 0;
        padding: 0;
        overflow-y: auto;
    }
    .aplayer-list::-webkit-scrollbar {
        display: none;
    }
    .aplayer-list ol {
        list-style-type: none;
        margin: 0;
        padding: 0;
        overflow-y: auto;
    }
    .aplayer-list li {
        position: relative;
        text-align: left;
        height: calc((var(--base-font-size) + 4px) * 2);
        line-height: 32px;
        padding: 0 15px;
        font-size: var(--base-font-size);
        border-top: 1px solid #e9e9e9;
        cursor: pointer;
        transition: background-color 0.15s ease;
        overflow: hidden;
        margin: 0;
        color: #333;
    }
    .aplayer-list li:first-child {
        border-top: none;
    }
    .aplayer-list li:hover {
        background: #efefef;
    }
    .aplayer-list-cur {
        width: 3px;
        height: calc((var(--base-font-size) + 4px) * 2 - 10px);
        position: absolute;
        left: 0;
        top: 5px;
        cursor: pointer;
        background-color: var(--theme-color);
    }
    .aplayer-list-index {
        color: #666;
        margin-right: 12px;
        cursor: pointer;
    }
    .aplayer-list-artist {
        color: #666;
        float: right;
        cursor: pointer;
    }

    /* ----- Layout variants (with-list / narrow) ----- */
    .aplayer.aplayer-withlist .aplayer-list {
        display: block;
    }
    .aplayer.aplayer-narrow {
        width: var(--aplayer-height);
    }
    .aplayer.aplayer-narrow .aplayer-info,
    .aplayer.aplayer-narrow .aplayer-list {
        display: none;
    }
    .aplayer.aplayer-narrow .aplayer-pic,
    .aplayer.aplayer-narrow .aplayer-body {
        height: var(--aplayer-height);
        width: var(--aplayer-height);
    }

    @keyframes aplayer-rotate {
        0% { transform: rotate(0); }
        100% { transform: rotate(360deg); }
    }
</style>
