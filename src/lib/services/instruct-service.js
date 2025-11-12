import { endpoints } from '$lib/services/api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http';
import axios from 'axios';

/**
 * Execute agent instruction by template or user provided prompt.
 * @param {string} agentId
 * @param {import('$instructTypes').InstructMessageModel} request
 * @returns {Promise<{ text: string }>}
 */
export async function executeAgentInstruction(agentId, request) {
    const url = replaceUrl(endpoints.instructCompletionUrl, {agentId: agentId});
    const response = await axios.post(url, request);
    return response.data;
}


/**
 * Execute chat completion.
 * @param {import('$instructTypes').IncomingInstructRequest} request
 */
export async function sendChatCompletion(request) {
    const url = endpoints.chatCompletionUrl;
    const response = await axios.post(url, request);
    return response.data;
}


/**
 * get instruction log search keys
 * @param {import('$instructTypes').StateSearchQuery} request
 * @returns {Promise<string[]>}
 */
export async function getInstructionLogSearchKeys(request) {
    let url = endpoints.instructLogSearchKeysUrl;
    const response = await axios.get(url, {
        params: {
            ...request
        },
        paramsSerializer: {
            dots: true,
            indexes: null,
        }
    });
    return response.data;
}