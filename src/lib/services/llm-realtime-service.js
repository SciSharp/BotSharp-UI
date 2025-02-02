import { endpoints } from '$lib/services/api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http';
import axios from 'axios';

export const llmRealtime = {
    /** @type {RTCPeerConnection} */
    pc: new RTCPeerConnection(),
    /** @param {string} agentId */
    async start(agentId) {
        const session = await initRealtimeSession(agentId);
        const EPHEMERAL_KEY = session.client_secret.value;

        this.pc = new RTCPeerConnection();

        // Set up to play remote audio from the model
        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        this.pc.ontrack = e => audioEl.srcObject = e.streams[0];

        // Add local audio track for microphone input in the browser
        const ms = await navigator.mediaDevices.getUserMedia({
            audio: true
        });
        this.pc.addTrack(ms.getTracks()[0]);

        // Set up data channel for sending and receiving events
        const dc = this.pc.createDataChannel("oai-events");
        dc.addEventListener("message", (e) => {
            // Realtime server events appear here!
            var data = JSON.parse(e.data);
            console.log(data);
        });

        // Start the session using the Session Description Protocol (SDP)
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        const baseUrl = "https://api.openai.com/v1/realtime";
        const sdpResponse = await fetch(`${baseUrl}?model=${session.model}`, {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            "Content-Type": "application/sdp"
          },
        });
        
        /** @type {RTCSessionDescriptionInit} */
        const answer = {
          type: "answer",
          sdp: await sdpResponse.text(),
        };
        await this.pc.setRemoteDescription(answer);
    },

    stop() {
        // Stop the peer connection
        this.pc.close();
    }
}

/**
 * Execute agent realtime interaction
 * @param {string} agentId
 * @returns {Promise<import('$realtimeTypes').RealtimeSession>}
 */
export async function initRealtimeSession(agentId) {
    let url = replaceUrl(endpoints.agentInitRealtimeSessionUrl, {agentId: agentId});
    var response = await axios.get(url);
    return response.data;
}