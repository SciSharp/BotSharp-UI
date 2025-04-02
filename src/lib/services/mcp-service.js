import { endpoints } from '$lib/services/api-endpoints.js';
import axios from 'axios';

/**
 * Get mcp server configs
 * @returns {Promise<import('$mcpTypes').McpServerConfigModel[]>}
 */
export async function getServerConfigs() {
    const url = endpoints.mcpServerConfigsUrl;
    const response = await axios.get(url);
    return response.data;
}