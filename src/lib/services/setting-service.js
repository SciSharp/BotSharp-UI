import { endpoints } from './api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http.js';
import axios from 'axios';

/**
 * Get settings list
 * @returns {Promise<string[]>}
 */
export async function getSettings() {
    let url = endpoints.settingListUrl;
    const response = await axios.get(url);
    return response.data;
}

/**
 * 
 * @param {string} id 
 * @returns {Promise<any>} 
 */
export async function getSettingDetail(id) {
    let url = replaceUrl(endpoints.settingDetailUrl, {id: id});
    const response = await axios.get(url);
    return response.data;
}