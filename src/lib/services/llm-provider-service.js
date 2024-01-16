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
 * @returns {Promise<import('$types').LlmModelSetting[]>}
 */
export async function getLlmProviderModels(provider) {
    let url = replaceUrl(endpoints.llmProviderModelsUrl, {provider: provider});
    const response = await axios.get(url);
    return response.data;
}