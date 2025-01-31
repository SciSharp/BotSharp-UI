import { endpoints } from '$lib/services/api-endpoints.js';
import axios from 'axios';

/**
 * Get dashboard settings
 * @returns {Promise<import('$userTypes').DashboardModel>}
 */
export async function getDashboardSettings() {
    const url = endpoints.dashboardSettingUrl;
    const response = await axios.get(url);
    return response.data;
}