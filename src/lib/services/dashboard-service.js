import { endpoints } from '$lib/services/api-endpoints.js';
import axios from 'axios';

/**
 * Get dashboard settings
 * @param {string} userId - The user id
 * @returns {Promise<import('$userTypes').DashboardModel>}
 */
export async function getDashboardSettings(userId) {
    let userIdParam = userId;
    let url = endpoints.dashboardSettingUrl;
    console.log(url);
    const response = await axios.get(url, {
        params: {
            "userId" : userId
        }
    });
    return response.data;
}