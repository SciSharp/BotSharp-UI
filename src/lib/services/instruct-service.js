import { endpoints } from '$lib/services/api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http';
import axios from 'axios';

/**
 * Execute agent instruction by template or user provided prompt.
 * @param {string} agentId
 * @param {import('$instructTypes').InstructMessageModel} instruction
 */
export async function executeAgentInstruction(agentId, instruction) {
    let url = replaceUrl(endpoints.instructCompletionUrl, {agentId: agentId});
    await axios.post(url, instruction);
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
