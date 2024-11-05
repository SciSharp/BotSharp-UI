import { endpoints } from './api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http.js';
import axios from 'axios';

/**
 * Get plugin list
 * @param {import('$pluginTypes').PluginFilter} filter
 * @returns {Promise<import('$commonTypes').PagedItems<import('$pluginTypes').PluginDefModel>>}
 */
export async function getPlugins(filter) {
    let url = endpoints.pluginListUrl;
    const response = await axios.get(url, { params: filter,
        paramsSerializer: {
            dots: true,
            indexes: null
        }
    });
    return response.data;
}

/**
 * Get plugin menu
 * @returns {Promise<import('$pluginTypes').PluginMenuDefModel[]>}
 */
export async function getPluginMenu() {
    let url = endpoints.pluginMenuUrl;
    const response = await axios.get(url);
    return response.data;
}

/**
 * Enable plugin
 * @param {string} id 
 * @returns {Promise<import('$pluginTypes').PluginDefModel>}
 */
export async function installPlugin(id) {
    let url = replaceUrl(endpoints.pluginInstallUrl, {id: id});
    const response = await axios.post(url);
    return response.data;
}

/**
 * Disable plugin
 * @param {string} id 
 * @returns {Promise<import('$pluginTypes').PluginDefModel>}
 */
export async function removePlugin(id) {
    let url = replaceUrl(endpoints.pluginRemoveUrl, {id: id});
    const response = await axios.post(url);
    return response.data;
}