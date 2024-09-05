import { endpoints } from '$lib/services/api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http';
import axios from 'axios';

/**
 * Execute agent instruction by template or user provided prompt.
 * @param {string} agentId
 * @param {import('$conversationTypes').InstructMessageModel} instruction
 */
export async function executeAgentInstruction(agentId, instruction) {
    let url = replaceUrl(endpoints.instructCompletionUrl, {agentId: agentId});
    await axios.post(url, instruction);
}