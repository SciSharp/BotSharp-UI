import { endpoints } from '$lib/services/api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http';
import axios from 'axios';

/**
 * Get agent list
 * @param {import('$agentTypes').AgentTaskFilter} filter
 * @returns {Promise<import('$commonTypes').PagedItems<import('$agentTypes').AgentTaskModel>>}
 */
export async function getAgentTasks(filter) {
    const response = await axios.get(endpoints.agentTaskListUrl, { params: filter,
        paramsSerializer: {
            dots: true,
            indexes: null,
        }
    });
    return response.data;
}

/**
 * Get task detail
 * @param {string} agentId 
 * @param {string} taskid 
 * @returns {Promise<import('$agentTypes').AgentTaskModel>}
 */
export async function getAgentTaskDetail(agentId, taskid) {
    const url = replaceUrl(endpoints.agentTaskDetailUrl, { agentId: agentId, taskId: taskid });
    var response = await axios.get(url);
    return response.data;
}