import { endpoints } from './api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http.js';
import axios from 'axios';
import qs from 'qs';

/**
 * Get provider list
 * @returns {Promise<string[]>}
 */
export async function getLlmProviders() {
    let url = endpoints.llmProvidersUrl;
    const response = await axios.get(url);
    return response.data;
}

/**
 * Get provider model list
 * @param {string} provider
 * @returns {Promise<import('$commonTypes').LlmModelSetting[]>}
 */
export async function getLlmProviderModels(provider) {
    let url = replaceUrl(endpoints.llmProviderModelsUrl, {provider: provider});
    const response = await axios.get(url);
    return response.data;
}


/**
 * Get llm configs
 * @param {import('$commonTypes').LlmConfigFilter?} [filter]
 * @returns {Promise<import('$commonTypes').LlmConfig[]>}
 */
export async function getLlmConfigs(filter = null) {
    const url = endpoints.llmConfigsUrl;
    const params = filter != null ? { filter: filter } : null;
    const response = await axios.get(url, {
        params: params,
        paramsSerializer: (params) => qs.stringify(params, { encode: false, allowDots: true, arrayFormat: "indices" })
    });
    return response.data;
}