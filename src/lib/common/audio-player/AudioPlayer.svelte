<script>
  import {
    initAudio,
    stopAll,
    clearAudioInstantce,
    useAudioStore
  } from "./store";
  import { volumeEventHandlers, progressEventHandlers } from "./handlers";
  import { onDestroy, onMount, createEventDispatcher } from "svelte";
  import { propsBool } from "./utils";
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

  const svelteDispatch = createEventDispatcher();

  /**
   * @param {string} name
   * @param {any?} detail
   */
  function dispatch(name, detail = null) {
    svelteDispatch(name, detail);
  };

  const {
    playList,
    audioList,
    currentSong,
    currentTime,
    duration,
    rdTime,
    rdBufTime,
    wtBufTime,
  } = useAudioStore(dispatch);

  /** @type {import('$types').AudioFileModel[]} */
  export let audio;

  /** @type {string} */
  export let id = uuidv4();

  /** @type {"list" | "random"} */
  export let order = 'list';

  /** @type {"none" | "all" | "one"} */
  export let loop = 'all';
  
  /** @type {number} */
  export let volume = 0.7;

  /** @type {boolean} */
  export let mini = false;

  /** @type {boolean} */
  export let mutex = true;

  /** @type {string} */
  export let theme = "#fadfa3";

  /** @type {number} */
  export let listMaxHeight = Infinity;

  /** @type {number} */
  export let playDelay = 300;

  /** @type {boolean} */
  export let autoPlayNextOnClick = true;

  /** @type {string} */
  export let baseFontSize = "12px";

  /** @type {HTMLElement} */
  let volumeBar;

  /** @type {HTMLElement} */
  let playedBar;

  /** @type {() => void} */
  let volumeDragStart;

  /** @type {(ev: any) => void} */
  let volumeDragMove;
  
  /** @type {(ev: any) => void} */
  let volumeDragEnd;

  /** @type {() => void} */
  let progressDragStart;
  
  /** @type {(ev: any) => void} */
  let progressDragMove;
  
  /** @type {(ev: any) => void} */
  let progressDragEnd;

  /** @type {() => void} */
  let toggleVolumeMute;

  /** @type {HTMLElement} */
  let playListElement;

  /** @type {HTMLElement} */
  let rootEl;

  /** @type {HTMLAudioElement} */
  let player;

  /** @type {boolean} */
  let isShowList = false;

  /** @type {boolean} */
  let muted = false;

  /** @type {string} */
  let volumePercentage;

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
    dispatch("destroy");
  });

  const init = () => {
    const audioPlayer = document.createElement("audio");
    id = id || uuidv4();
    initAudio({ id: id, player: audioPlayer }, dispatch);
    isShowList = !propsBool($$props, "list_folded") && $audioList.length > 1;
    volume = Math.max(volume, 0);
    volume = Math.min(volume, 1);
    audioPlayer.volume = volume;
    return audioPlayer;
  }

  $: $playList.audio = audio;
  $: {
    if (muted) {
      volumePercentage = '0%';
    } else {
      volumePercentage = `${volume * 100}%`;
    }
  }
  $: playerListHeight = Math.min(playListElement?.scrollHeight ?? 0, listMaxHeight);
  $: themeColor = $currentSong.theme ?? theme;
  $: {
    if (player) {
      player.src = $currentSong.url;
    }
  }
  $: {
    if (rootEl) {
      rootEl.style.setProperty("--theme-color", themeColor);
      rootEl.style.setProperty("--base-font-size", baseFontSize);
    }
  }

  const play = () => {
    if (mutex) {
      stopAll();
    }

    if (player) {
      setTimeout(() => {
        player.play().catch((err) => {
          console.error(err);
        });
      }, 500);
    }
  };

  const jumpNext = () => {
    const audios = $audioList;
    const nextIdx = ($playList.playingIndex + 1) % audios.length;
    if (loop === "none") {
      if (order === "list") {
        if ($playList.playingIndex < audios.length - 1) {
          const promise = buildNextSongPromise(nextIdx);
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
        const promise = buildNextSongPromise(targetIdx);
        promise.then(() => play());
      }
    } else if (loop === "one") {
      player.currentTime = 0;
    } else if (loop === "all") {
      const promise = buildNextSongPromise(nextIdx);
      promise.then(() => play());
    }
  };

  /**
   * @param {number} idx
   */
  function buildNextSongPromise(idx) {
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
  function switchSong(idx) {
    const promise = buildNextSongPromise(idx);
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
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="aplayer-pic"
      style="background-image: url( {$currentSong.cover} )"
      on:click={() => {
        player?.paused ? play() : player.pause();
      }}
    >
      {#if !player?.paused}
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
        <span class="aplayer-title">{$currentSong.name || ''}</span>
        <span class="aplayer-artist">{$currentSong.artist || ''}</span>
      </div>

      <div class="aplayer-controller">
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="aplayer-bar-wrap"
          bind:this={playedBar}
          on:mousedown={progressDragStart}
          on:mousemove={progressDragMove}
          on:mouseup={progressDragEnd}
          on:mouseleave={progressDragEnd}
          on:touchstart={progressDragStart}
          on:touchmove={progressDragMove}
          on:touchend={progressDragEnd}
        >
          <div class="aplayer-bar">
            <div
              class="aplayer-loaded"
              style="width: {$rdBufTime.bufferPercentage}"
            />
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
              on:click|capture={() => {
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
              <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              class="aplayer-volume-bar-wrap"
              on:mousedown={volumeDragStart}
              on:mousemove={volumeDragMove}
              on:mouseup={volumeDragEnd}
              on:mouseleave={volumeDragEnd}
              on:touchstart={volumeDragStart}
              on:touchmove={volumeDragMove}
              on:touchend={volumeDragEnd}
            >
              <div class="aplayer-volume-bar" bind:this={volumeBar}>
                <div
                  class="aplayer-volume"
                  style="height: {player?.muted ? '0px' : volumePercentage}"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            class="aplayer-icon aplayer-icon-order"
            on:click={() => clickOrder()}
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
            on:click={() => clickLoop()}
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
            on:click={() => toggleList()}
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
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
          <li on:click={() => switchSong(idx) }>
          {#if idx === $playList.playingIndex}
            <span class="aplayer-list-cur" />
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