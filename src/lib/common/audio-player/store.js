import { derived, writable } from "svelte/store";
import { secondToTime } from "./utils";

/** @type {HTMLAudioElement[]} */
export const instances = [];

/**
 * @param {HTMLAudioElement} player
 * @param {(name: string, detail?: any) => void} dispatch
 */
export function initPlayer(player, dispatch) {
  instances.push(player);
  bindAudioEvent(player, dispatch);
}

/**
 * @param {HTMLAudioElement} player
 * @param {(name: string, detail?: any) => void} dispatch
 */
function bindAudioEvent(player, dispatch) {
  const audioEvents = [
    "abort",
    "canplay",
    "canplaythrough",
    "durationchange",
    "emptied",
    "ended",
    "error",
    "loadeddata",
    "loadedmetadata",
    "loadstart",
    "mozaudioavailable",
    "pause",
    "play",
    "playing",
    "progress",
    "ratechange",
    "seeked",
    "seeking",
    "stalled",
    "suspend",
    "timeupdate",
    "volumechange",
    "waiting",
  ];
  audioEvents.forEach((name) => {
    player?.addEventListener(name, (ev) => {
      dispatch(name, ev);
    });
  });
}

/**
 * @param {(name: string, detail?: any) => void} dispatch
 */
export function useAudioStore(dispatch) {
  let currentTime = writable(0);
  let duration = writable(NaN);

  const rdTime = derived(
    [currentTime, duration],
    ([$currentTime, $duration]) => {
      let playPercentage = $currentTime / $duration;
      playPercentage = Math.max(playPercentage, 0);
      playPercentage = Math.min(playPercentage, 1);
      playPercentage *= 100;
      return {
        ptime: secondToTime($currentTime),
        duration: secondToTime($duration),
        playPercentage: `${playPercentage}%`,
      };
    }
  );

  let wtBufTime = writable(0);
  const rdBufTime = derived([wtBufTime, duration], ([$bufTime, $duration]) => {
    let bufferPercentage = $bufTime / $duration;
    bufferPercentage = Math.max(bufferPercentage, 0);
    bufferPercentage = Math.min(bufferPercentage, 1);
    bufferPercentage *= 100;
    return { bufferPercentage: `${bufferPercentage}%`, bufTime: $bufTime };
  });

  /** @type {import("svelte/store").Writable<{ playingIndex: number, audio: any[] }>} */
  const playList = writable({
    playingIndex: 0,
    audio: [],
  });

  const audioList = derived(playList, ($pl) => $pl.audio);
  const currentSong = derived(playList, ($wt) => $wt.audio[$wt.playingIndex]);

  let initSong = false;
  currentSong.subscribe((song) => {
    if (initSong) {
      dispatch("listswitch", song);
    }
    initSong = true;
  });

  let initAudioList = false;
  audioList.subscribe((list) => {
    if (initAudioList) {
      dispatch("listchange", list);
    }
    initAudioList = true;
  });

  return {
    playList,
    audioList,
    currentSong,
    currentTime,
    duration,
    rdTime,
    rdBufTime,
    wtBufTime,
  };
}