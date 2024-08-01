/**
 * @param {HTMLAudioElement} player
 * @param {HTMLElement} progressBar
 */
export function progressEventHandlers(player, progressBar) {
  let progressActive = false;

  function progressDragStart() {
      progressActive = true;
  };

  /**
   * @param {any} ev
   */
  function progressDragMove(ev) {
    if (progressActive) {
      let percentage = ((ev.clientX || ev.changedTouches[0].clientX) - progressBar.getBoundingClientRect().left) / progressBar.clientWidth;
      percentage = Math.max(percentage, 0);
      percentage = Math.min(percentage, 1);
      player.currentTime = player.duration * percentage;
    }
  };

  /**
   * @param {any} ev
   */
  function progressDragEnd(ev) {
    if (progressActive) {
      progressActive = false;
      let percentage = ((ev.clientX || ev.changedTouches[0].clientX) - progressBar.getBoundingClientRect().left) / progressBar.clientWidth;
      percentage = Math.max(percentage, 0);
      percentage = Math.min(percentage, 1);
      player.currentTime = player.duration * percentage;
    }
  };

  return {
    progressDragStart,
    progressDragMove,
    progressDragEnd,
  };
}

/**
 * @param {HTMLAudioElement} player
 * @param {HTMLElement} volumeBar
 */
export function volumeEventHandlers(player, volumeBar) {
  let volumeActive = false;

  function volumeDragStart() {
    volumeActive = true;
  };

  /**
   * @param {any} ev
   */
  function volumeDragMove(ev) {
    if (volumeActive) {
      let percentage = 1 - ((ev.clientY || ev.changedTouches[0].clientY) - volumeBar.getBoundingClientRect().top) / volumeBar.clientHeight;
      percentage = Math.max(percentage, 0);
      percentage = Math.min(percentage, 1);
      player.volume = percentage;
    }
  };

  /**
   * @param {any} ev
   */
  function volumeDragEnd(ev) {
    if (volumeActive) {
      let percentage = 1 - ((ev.clientY || ev.changedTouches[0].clientY) - volumeBar.getBoundingClientRect().top) / volumeBar.clientHeight;
      percentage = Math.max(percentage, 0);
      percentage = Math.min(percentage, 1);
      player.volume = percentage;
      volumeActive = false;
    }
  };

  const toggleVolumeMute = () => {
    player.muted = !player.muted;
  };

  return {
    volumeDragStart,
    volumeDragMove,
    volumeDragEnd,
    toggleVolumeMute };
}