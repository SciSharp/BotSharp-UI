import { setAuthorization, replaceUrl } from '$lib/helpers/http';
import { endpoints } from './api-endpoints.js';
import axios from 'axios';

/**
 * Get plugin list
 * @returns {Promise<import('$types').PluginDefModel[]>}
 */
export async function GetPlugins() {
    setAuthorization();
    let url = endpoints.pluginListUrl;
    const response = await axios.get(url);
    return response.data;
}
