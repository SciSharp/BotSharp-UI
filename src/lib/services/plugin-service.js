import { endpoints } from './api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http.js';
import axios from 'axios';

/**
 * Get plugin list
 * @returns {Promise<import('$types').PluginDefModel[]>}
 */
export async function getPlugins() {
    let url = endpoints.pluginListUrl;
    const response = await axios.get(url);
    return response.data;
}

/**
 * Get plugin menu
 * @returns {Promise<import('$types').PluginMenuDefModel[]>}
 */
export async function getPluginMenu() {
    let url = endpoints.pluginMenuUrl;
    const response = await axios.get(url);
    return response.data;
}

/**
 * Enable plugin
 * @param {string} id 
 * @returns {Promise<import('$types').PluginDefModel>}
 */
export async function enablePlugin(id) {
    let url = replaceUrl(endpoints.pluginEnableUrl, {id: id});
    const response = await axios.post(url);
    return response.data;
}

/**
 * Disable plugin
 * @param {string} id 
 * @returns {Promise<import('$types').PluginDefModel>}
 */
export async function disablePlugin(id) {
    let url = replaceUrl(endpoints.pluginDisableUrl, {id: id});
    const response = await axios.post(url);
    return response.data;
}