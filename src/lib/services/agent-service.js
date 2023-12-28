import { setAuthorization } from '$lib/helpers/http';
import { endpoints } from '$lib/services/api-endpoints.js';
import axios from 'axios';

/**
 * Get agent list
 * @param {import('$types').AgentFilter} filter
 * @returns {Promise<import('$types').AgentModel[]>}
 */
export async function getAgents(filter) {
    setAuthorization();
    let url = endpoints.agentListUrl;
    const response = await axios.get(url, {
        params: filter
    });
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

/**
 * Save agent detail
 * @param {import('$types').AgentModel} agent
 */
export async function saveAgent(agent) {
    setAuthorization();
    let url = endpoints.agentDetailUrl.replace("{id}", agent.id);
    await axios.put(url, agent);
}

