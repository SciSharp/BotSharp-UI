import { AudioRecordingWorklet } from "$lib/helpers/pcmProcessor";

// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// @ts-ignore
const AudioContext = window.AudioContext || window.webkitAudioContext;

export const realtimeChat = {
    
    /** @type {WebSocket | null} */
    socket: null,

    /** @type {MediaRecorder | null} */
    mediaRecorder: null,

    /** @type {MediaStream | null} */
    mediaStream: null,

    /** @type {SpeechRecognition | null} */
    recognition: null,

    /**
     * @param {string} agentId
     * @param {string} conversationId
     */
    start(agentId, conversationId) {
        this.socket = new WebSocket(`ws://localhost:5100/chat/stream/${agentId}/${conversationId}`);
      
        this.socket.onopen = async () => {
            console.log("WebSocket connected");

            this.socket?.send(JSON.stringify({
                event: "start"
            }));

            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = new AudioContext({ sampleRate: 16000 });

            const workletName = "audio-recorder-worklet";
            const src = createWorketFromSrc(workletName, AudioRecordingWorklet);
            await audioCtx.audioWorklet.addModule(src);

            const workletNode = new AudioWorkletNode(audioCtx, workletName);
            const micSource = audioCtx.createMediaStreamSource(this.mediaStream);
            micSource.connect(workletNode);

            workletNode.port.onmessage = event => {
                const arrayBuffer = event.data.data.int16arrayBuffer;
                if (arrayBuffer && this.socket?.readyState === WebSocket.OPEN) {
                    const arrayBufferString = arrayBufferToBase64(arrayBuffer);
                    this.socket.send(JSON.stringify({
                        event: 'media',
                        payload: arrayBufferString
                    }));
                }
            };

            // this.recognition = new SpeechRecognition();
            // this.recognition.continuous = true;
            // this.recognition.interimResults = false;
            // this.recognition.lang = "en-US";

            // this.recognition.onresult = (/** @type { any } */ event) => {
            //     const lastResult = event.results[event.results.length - 1];
            //     const transcript = lastResult[0].transcript.trim();
            
            //     console.log("Recognized:", transcript);
            
            //     const message = {
            //       event: "media",
            //       payload: transcript
            //     };

            //     if (this.socket?.readyState === WebSocket.OPEN) {
            //         this.socket.send(JSON.stringify(message));
            //     }
            //   };
            
            // this.recognition.onend = () => {
            //     console.log('Speech recognition closed.');
            // };
            // this.recognition.start();

            // navigator.mediaDevices.getUserMedia({ audio: true })
            //     .then(stream => {
            //         this.mediaStream = stream;
            //         this.mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            //         /** @type {any[]} */
            //         let audioChunks  = [];
            //         this.mediaRecorder.ondataavailable = (/** @type {any} */ event) => {
            //             if (event.data.size > 0) {
            //                 // audioChunks.push(event.data);
            //             }
            //         };

            //         this.mediaRecorder.onstop = async () => {
            //             console.log('mediaRecorder stopped');
            //             // const blob = new Blob(audioChunks, { type: 'audio/webm' });
            //             // const arrayBuffer = await blob.arrayBuffer();
                    
            //             // // Decode audio and downsample to PCM16
            //             // const audioCtx = new AudioContext({ sampleRate: 16000 });
            //             // const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    
            //             // const channelData = audioBuffer.getChannelData(0); // mono
            //             // const pcm16 = new Int16Array(channelData.length);
                    
            //             // for (let i = 0; i < channelData.length; i++) {
            //             //   pcm16[i] = Math.max(-1, Math.min(1, channelData[i])) * 32767;
            //             // }
                    
            //             // const pcmBytes = new Uint8Array(pcm16.buffer);
            //             // const base64 = btoa(String.fromCharCode(...pcmBytes));
            //             // console.log(base64);
            //         };

            //         this.mediaRecorder.start();
            //     })
            //     .catch((err) => {
            //         console.error("Failed to access microphone", err);
            //     });
        };

        this.socket.onclose = () => {
            console.log("Websocket closed");
        }
      
        this.socket.onerror = (/** @type {any} */ e) => console.error('WebSocket error', e);
    },

    stop() {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(t => t.stop());
            this.mediaStream = null;
        }

        if (this.recognition) {
            this.recognition.stop();
        }

        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                event: 'disconnect'
            }));
            this.socket.close();
        }
    }
};

/**
 * @param {ArrayBuffer} buffer
 */
function arrayBufferToBase64(buffer) {
    var binary = "";
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * @param {string} workletName
 * @param {string} workletSrc
 */
function createWorketFromSrc(workletName, workletSrc) {
    const script = new Blob(
      [`registerProcessor("${workletName}", ${workletSrc})`],
      {
        type: "application/javascript",
      },
    );
  
    return URL.createObjectURL(script);
};