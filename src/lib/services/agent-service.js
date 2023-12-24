import { setAuthorization } from '$lib/helpers/http';
import { endpoints } from '$lib/services/api-endpoints.js';
import axios from 'axios';

/**
 * Get agent list
 * @returns {Promise<import('$types').AgentModel[]>}
 */
export async function getAgents() {
    setAuthorization();
    let url = endpoints.agentListUrl;
    const response = await axios.get(url);
    return response.data;
}

/**
 * Get agent detail
 * @param {string} id
 * @returns {Promise<import('$types').AgentModel>}
 */
export async function getAgent(id) {
    setAuthorization();
    let url = endpoints.agentDetailUrl.replace("{id}", id);
    const response = await axios.get(url);
    return response.data;
}
