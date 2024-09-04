// Speech
/**
 * @typedef {Object} SpeechModel
 * @property {string} id
 * @property {SpeechSynthesis} synth
 * @property {SpeechSynthesisUtterance} utterThis
 * @property {() => void} stop
 * @property {() => boolean} isPlaying
 */

/**
 * @typedef {Object} AudioModel
 * @property {string} id
 * @property {HTMLAudioElement} player
 * @property {() => void} stop
 */

export default {};