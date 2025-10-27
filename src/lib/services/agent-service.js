import { endpoints } from '$lib/services/api-endpoints.js';
import axios from 'axios';
import qs from 'qs';

/**
 * Get agent settings
 * @returns {Promise<import('$agentTypes').AgentSettings>}
 */
export async function getSettings() {
    let url = endpoints.agentSettingUrl;
    const response = await axios.get(url);
    return response.data;
}

/**
 * Get agent list
 * @param {import('$agentTypes').AgentFilter} filter
 * @param {boolean} checkAuth
 * @returns {Promise<import('$commonTypes').PagedItems<import('$agentTypes').AgentModel>>}
 */
export async function getAgents(filter, checkAuth = false) {
    let url = endpoints.agentListUrl;
    const response = await axios.get(url, {
        params: {
            ...filter,
            checkAuth : checkAuth
        },
        paramsSerializer: {
            dots: true,
            indexes: null,
        }
    });
    return response.data;
}

/**
 * Get agent list
 * @returns {Promise<import('$commonTypes').IdName[]>}
 */
export async function getAgentOptions() {
    let url = endpoints.agentOptionsUrl;
    const response = await axios.get(url);
    return response.data;
}

/**
 * Get agent detail
 * @param {string} id
 * @returns {Promise<import('$agentTypes').AgentModel>}
 */
export async function getAgent(id) {
    let url = endpoints.agentDetailUrl.replace("{id}", id);
    const response = await axios.get(url);
    return response.data;
}

/**
 * Save agent detail
 * @param {import('$agentTypes').AgentModel} agent
 */
export async function saveAgent(agent) {
    let url = endpoints.agentDetailUrl.replace("{id}", agent.id);
    await axios.put(url, agent);
}

/**
 * Delete agent detail
 * @param {string} agentId
 */
export async function deleteAgent(agentId) {
    let url = endpoints.agentDetailUrl.replace("{id}", agentId);
    await axios.delete(url);
}

/**
 * Refresh agent data
 * @returns {Promise<string>}
 */
export async function refreshAgents() {
    const url = endpoints.agentRefreshUrl;
    const response = await axios.post(url, {});
    return response.data;
}

/**
 * Create agent
 * @param {import('$agentTypes').AgentModel} agent
 * @returns {Promise<import('$agentTypes').AgentModel>}
 */
export async function createAgent(agent) {
    const url = endpoints.agentCreateUrl;
    const response = await axios.post(url, agent);
    return response.data;
}

/**
 * Get agent utility options
 * @returns {Promise<import('$agentTypes').AgentUtility[]>}
 */
export async function getAgentUtilityOptions() {
    const url = endpoints.agentUtilityOptionsUrl;
    const response = await axios.get(url);
    return response.data;
}

/**
 * Get agent rule options
 * @returns {Promise<import('$agentTypes').AgentRule[]>}
 */
export async function getAgentRuleOptions() {
    const url = endpoints.agentRuleOptionsUrl;
    const response = await axios.get(url);
    return response.data;
}

/**
 * Get agent labels
 * @returns {Promise<string[]>}
 */
export async function getAgentLabels() {
    const url = endpoints.agentLabelsUrl;
    const response = await axios.get(url);
    return response.data;
}


/**
 * Get agent code scripts
 * @param {string} agentId
 * @param {import('$agentTypes').AgentCodeScriptFilter?} filter
 * @returns {Promise<import('$agentTypes').AgentCodeScriptViewModel[]>}
 */
export async function getAgentCodeScripts(agentId, filter = null) {
    const url = endpoints.agentCodeScriptListUrl.replace("{agentId}", agentId);
    const response = await axios.get(url, {
        params: {
            ...filter
        },
        paramsSerializer: (params) => qs.stringify(params, { encode: false, allowDots: true, arrayFormat: "indices" })
    });
    return response.data;
}

/**
 * Update agent code scripts
 * @param {string} agentId
 * @param {import('$agentTypes').AgentCodeScriptUpdateModel} update
 * @returns {Promise<boolean>}
 */
export async function updateAgentCodeScripts(agentId, update) {
    const url = endpoints.agentCodeScriptUpdateUrl.replace("{agentId}", agentId);
    const response = await axios.post(url, {
        ...update
    });
    return response.data;
}