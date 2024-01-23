import { endpoints } from '$lib/services/api-endpoints.js';
import axios from 'axios';

/**
 * Get agent settings
 * @returns {Promise<import('$types').AgentSettings>}
 */
export async function getSettings() {
    let url = endpoints.agentSettingUrl;
    const response = await axios.get(url);
    return response.data;
}

/**
 * Get agent list
 * @param {import('$types').AgentFilter} filter
 * @returns {Promise<import('$types').PagedItems<import('$types').AgentModel>>}
 */
export async function getAgents(filter) {
    let url = endpoints.agentListUrl;
    const response = await axios.get(url, { params: filter,
        paramsSerializer: {
            dots: true
        }
    });
    return response.data;
}

/**
 * Get agent detail
 * @param {string} id
 * @returns {Promise<import('$types').AgentModel>}
 */
export async function getAgent(id) {
    let url = endpoints.agentDetailUrl.replace("{id}", id);
    const response = await axios.get(url);
    return response.data;
}

/**
 * Save agent detail
 * @param {import('$types').AgentModel} agent
 */
export async function saveAgent(agent) {
    let url = endpoints.agentDetailUrl.replace("{id}", agent.id);
    await axios.put(url, agent);
}

/**
 * Refresh agent data
 */
export async function refreshAgents() {
    const url = endpoints.agentRefreshUrl;
    await axios.post(url);
}