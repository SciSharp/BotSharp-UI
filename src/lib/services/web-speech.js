// https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;

const synth = window.speechSynthesis;


const utterThis = new SpeechSynthesisUtterance();
utterThis.pitch = 1;
utterThis.rate = 1;

export const SPEECH_VOICES = [
    "Microsoft Michelle Online (Natural) - English (United States)",
    "Google US English"
];

export const webSpeech = {
      /** @type {import('$types').OnSpeechToTextDetected} */
    onSpeechToTextDetected: () => {},

    start() {
        recognition.start();
        console.log("Ready to receive a voice command.");      
    },

    /** @param {string} transcript */
    utter(transcript) {
        setVoiceSynthesis();
        utterThis.text = transcript
        synth.speak(utterThis);
    },

    stop() {
        synth.cancel();
    }
}

function setVoiceSynthesis() {
    if (utterThis.voice == null) {
        const voices = synth.getVoices();
        for (let i = 0; i < voices.length; i++) {
            if (SPEECH_VOICES.includes(voices[i].name)) {
              utterThis.voice = voices[i];
              console.log(voices[i].name);
              break;
            }
        }
    }
}

recognition.onresult = (/** @type {any} */ event) => {
    const text = event.results[0][0].transcript;
    console.log(`Confidence: ${text} ${event.results[0][0].confidence}`);
    webSpeech.onSpeechToTextDetected(text);
};

recognition.onnomatch = (/** @type {any} */ event) => {
    console.log("I didn't recognize that color.");
};

recognition.onerror = (/** @type {any} */ event) => {
    console.log(`Error occurred in recognition: ${event.error}`);
};

