import { endpoints } from '$lib/services/api-endpoints.js';
import axios from 'axios';

/**
 * Get router settings
 * @returns {Promise<import('$agentTypes').RouterSettings>}
 */
export async function getSettings() {
    let url = endpoints.routerSettingUrl;
    const response = await axios.get(url);
    return response.data;
}