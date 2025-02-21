import { endpoints } from './api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http.js';
import axios from 'axios';

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
 * @param {import('$commonTypes').LlmConfigOption?} [options]
 * @returns {Promise<import('$commonTypes').LlmConfig[]>}
 */
export async function getLlmConfigs(options = null) {
    const url = endpoints.llmConfigsUrl;
    const response = await axios.get(url, {
        params: {
            options: options
        },
        paramsSerializer: {
            dots: true,
            indexes: null,
        }
    });
    return response.data;
}