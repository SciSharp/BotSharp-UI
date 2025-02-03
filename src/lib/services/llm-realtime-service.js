import { endpoints } from '$lib/services/api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http';
import axios from 'axios';
import { json } from '@sveltejs/kit';

export const llmRealtime = {
    /** @type {RTCPeerConnection} */
    pc: new RTCPeerConnection(),
    /** 
     * @param {string} agentId 
     * @param {function} onMessageReceived
    */
    async start(agentId, onMessageReceived) {
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
        dc.addEventListener("message", async (e) => {
            // Realtime server events appear here!
            var data = JSON.parse(e.data);
            console.log(data);
            if (data.type === "response.done" && data.response.status == "completed") {
                await handleServerEvents(agentId, data, dc);
            }
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

        // send on data channel connect is open
        dc.onopen = () => {
            console.log("Data channel is open");
            /*const responseCreate = {
                type: "response.create",
                response: {
                modalities: ["audio", "text"],
                instructions: "Write a haiku about code",
                },
            };
            dc.send(JSON.stringify(responseCreate));*/
        };

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

/**
 * Handle server events
 * @param {string} agentId
 * @param {Object} data
 * @param {RTCDataChannel} dc
 */
async function handleServerEvents(agentId, data, dc) {
    // for each response.output, do something with it
    data.response.output.forEach(async completion => {
        if (completion.type === "function_call") {
            const result = await callFunction(agentId, completion.name, completion.arguments);
            console.log(result);

            // send the result back to the model
            const conversationItemCreation = {
                "type": "conversation.item.create",
                "item": {
                    "call_id": completion.call_id,
                    "type": "function_call_output",
                    "output": result
                }
            };
            dc.send(JSON.stringify(conversationItemCreation));

            /*const conversationItemResponse = {
                "type": "response.create",
                "response": {
                    "modalities": ["text", "audio"],
                    "instructions": "Please continue the conversation based on the function output.",
                }
            };
            dc.send(JSON.stringify(conversationItemResponse));*/
        }
    });
}

/**
 * Execute agent function call
 * @param {string} agentId
 * @param {string} functionName
 * @param {string} args
 * @returns {Promise<string>}
 */
async function callFunction(agentId, functionName, args) {
    let url = replaceUrl(endpoints.agentFunctionCallUrl, {
        agentId: agentId,
        functionName: functionName
    });
    
    const functionArgs = JSON.parse(args);
    var response = await axios.post(url, functionArgs);
    return JSON.stringify(response.data);
}