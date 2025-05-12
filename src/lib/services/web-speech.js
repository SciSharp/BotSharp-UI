// // https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API
// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;


export const SPEECH_VOICES = [
    "Microsoft Michelle Online (Natural) - English (United States)",
    "Google US English"
];

export const webSpeech = {
    /** @type {SpeechRecognition | null} */
    recognition: null,

    /** @type {import('$conversationTypes').OnSpeechToTextDetected} */
    onSpeechToTextDetected: () => {},

    onRecognitionStarted: () => {},

    onRecognitionEnded: () => {},

    /** @param {{continuous?: boolean, lang?: string, interimResults?: boolean, maxAlternatives?: number}} options */
    start(options = {
        continuous: false,
        lang: "en-US",
        interimResults: false,
        maxAlternatives: 1
    }) {
        this.recognition = !navigator.userAgent.includes('Firefox') ? new SpeechRecognition() : null;
        if (this.recognition == null) return;

        this.recognition.continuous = options.continuous || false;
        this.recognition.lang = options.lang || "en-US";
        this.recognition.interimResults = options.interimResults || false;
        this.recognition.maxAlternatives = options.maxAlternatives || 1;

        this.recognition.onstart = () => {
            console.log('Recognition starts...');
            this.onRecognitionStarted?.();
        };

        this.recognition.onresult = (/** @type {any} */ event) => {
            const len = event.results.length;
            const text = event.results[len-1][0].transcript;
            console.log(`Confidence: ${text} ${event.results[len-1][0].confidence}`);
            this.onSpeechToTextDetected?.(text);
        };

        this.recognition.onsoundstart = () => {
            console.log('Recognition sound start...');
        };

        this.recognition.onaudiostart = () => {
            console.log('Recognition audio start...');
        };

        this.recognition.onspeechstart = () => {
            console.log('Recognition speech start...');
        };
        
        this.recognition.onnomatch = () => {
            console.log("I didn't recognize the voice.");
        };
        
        this.recognition.onerror = (/** @type {any} */ event) => {
            console.log(`Error occurred in recognition: ${event.error}`);
        };

        this.recognition.onend = () => {
            console.log('Recognition is ended.');
            this.onRecognitionEnded?.();
        };

        try {
            this.recognition.start();
        } catch (err) {
            console.log('Error when starting speach recognition...');
            setTimeout(() => {
                this.recognition.start();
            }, 500);
        }
    },

    abort() {
        if (this.recognition) {
            this.recognition.abort();
        }
    }
};

export const webSpeaker = {
    /** @type {SpeechSynthesisUtterance | null} */
    utter: null,

    synth: window.speechSynthesis,

    /** @param {string} transcript */
    speak(transcript) {
        this.utter = new SpeechSynthesisUtterance();
        this.utter.pitch = 1;
        this.utter.rate = 1;
        this.utter.text = transcript;
        
        // set voice
        if (this.utter.voice == null) {
            this.utter.voice = this.synth.getVoices().find(x => SPEECH_VOICES.includes(x.name)) || null;
        }

        this.synth.speak(this.utter);
    },

    stop() {
        this.synth.cancel();
        this.utter = null;
    }
};