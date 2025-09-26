import { PUBLIC_SERVICE_URL } from "$env/static/public";
import { buildConversationUserStates } from "$lib/helpers/conversation";
import { AudioRecordingWorklet } from "$lib/helpers/realtime/pcmProcessor";

// @ts-ignore
const AudioContext = window.AudioContext || window.webkitAudioContext;

const sampleRate = 24000;

/** @type {AudioContext} */
let audioCtx = new AudioContext();

/** @type {any[]} */
let audioQueue = [];

/** @type {boolean} */
let isPlaying = false;

/** @type {WebSocket | null} */
let socket = null;

/** @type {MediaStream | null} */
let mediaStream = null;

/** @type {AudioWorkletNode | null} */
let workletNode = null;

/** @type {MediaStreamAudioSourceNode | null} */
let micSource = null;

export const realtimeChat = {
    
    /**
     * @param {string} agentId
     * @param {string} conversationId
     */
    start(agentId, conversationId) {
        reset();
        const wsUrl = buildWebsocketUrl();
        socket = new WebSocket(`${wsUrl}/chat/stream/${agentId}/${conversationId}`);
      
        socket.onopen = async () => {
            console.log("WebSocket connected");

            socket?.send(JSON.stringify({
                event: "start",
                body: {
                    payload: JSON.stringify({
                        states: buildConversationUserStates(conversationId),
                        realtime_options: {
                            input_audio_format: "pcm16",
                            output_audio_format: "pcm16"
                        }
                    })
                }
            }));

            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioCtx = new AudioContext({ sampleRate: sampleRate });

            const workletName = "audio-recorder-worklet";
            const src = createWorkletFromSrc(workletName, AudioRecordingWorklet);
            await audioCtx.audioWorklet.addModule(src);

            workletNode = new AudioWorkletNode(audioCtx, workletName);
            micSource = audioCtx.createMediaStreamSource(mediaStream);
            micSource.connect(workletNode);

            workletNode.port.onmessage = event => {
                const arrayBuffer = event.data.data.int16arrayBuffer;
                if (arrayBuffer && socket?.readyState === WebSocket.OPEN) {
                    if (event.data.data.speaking) {
                        reset();
                    }
                    const arrayBufferString = arrayBufferToBase64(arrayBuffer);
                    socket.send(JSON.stringify({
                        event: 'media',
                        body: {
                            payload: arrayBufferString
                        }
                    }));
                }
            };
        };

        socket.onmessage = (/** @type {MessageEvent} */ e) => {
            try {
                const json = JSON.parse(e.data);
                if (json.event === 'media' && !!json.media.payload) {
                    const data = json.media.payload;
                    enqueueAudioChunk(data);
                }
            } catch {
                // console.error('Error when parsing message');
            }
        };

        socket.onclose = (e) => {
            console.log("Websocket closed", e);
        };
      
        socket.onerror = (/** @type {Event} */ e) => {
            console.error('WebSocket error', e);
        };
    },

    stop() {
        reset();
        
        if (mediaStream) {
            mediaStream.getTracks().forEach(t => t.stop());
            mediaStream = null;
        }

        if (workletNode) {
            micSource?.disconnect(workletNode);
            workletNode.port.close();
            workletNode.disconnect();
            micSource = null;
            workletNode = null;
        }

        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                event: 'disconnect'
            }));
            socket.close(1000, "Normal Closure");
            socket = null;
        }
    }
};


function buildWebsocketUrl() {
    let url = '';
    const host = PUBLIC_SERVICE_URL.split('://');

    if (PUBLIC_SERVICE_URL.startsWith('https')) {
        url = `wss://${host[1]}`;
    } else if (PUBLIC_SERVICE_URL.startsWith('http')) {
        url = `ws://${host[1]}`;
    }
    return url;
}

function reset() {
    isPlaying = false;
    audioQueue = [];
}

/**
 * @param {string} base64Audio
 */
function enqueueAudioChunk(base64Audio) {
    const arrayBuffer = base64ToArrayBuffer(base64Audio);
    const float32Data = convert16BitPCMToFloat32(arrayBuffer);
  
    const audioBuffer = audioCtx.createBuffer(1, float32Data.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Data);
    audioQueue.push(audioBuffer);
  
    if (!isPlaying) {
        playNext();
    }
}

function playNext() {
    if (audioQueue.length === 0) {
      isPlaying = false;
      return;
    }
  
    isPlaying = true;
    const buffer = audioQueue.shift();
  
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.onended = () => {
        playNext();
    };
    source.start();
}


/**
 * @param {string} workletName
 * @param {string} workletSrc
 */
function createWorkletFromSrc(workletName, workletSrc) {
    const script = new Blob(
      [`registerProcessor("${workletName}", ${workletSrc})`],
      {
        type: "application/javascript",
      },
    );
  
    return URL.createObjectURL(script);
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
    return btoa(binary);
};

/**
 * @param {string} base64
 */
function base64ToArrayBuffer(base64) {
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
};

/**
 * @param {ArrayBuffer} buffer
 */
function convert16BitPCMToFloat32(buffer) {
    const chunk = new Uint8Array(buffer);
    const output = new Float32Array(chunk.length / 2);
    const dataView = new DataView(chunk.buffer);

    for (let i = 0; i< chunk.length / 2; i++) {
        try {
            const int16 = dataView.getInt16(i * 2, true);
            output[i] = int16 / 32768;
        } catch (e) {
            console.error(e);
        }
    }
    return output;
};