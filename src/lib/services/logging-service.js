import { replaceUrl } from '$lib/helpers/http.js';
import { endpoints } from './api-endpoints.js';
import axios from 'axios';

/**
 * Show backend full log
 */
export async function getFullLog() {
    axios({
        url: endpoints.loggingFullLogUrl,
        method: 'GET',
        responseType: 'blob'
    }).then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        link.remove();
    })
}

/**
 * Get conversation content log
 * @param {string} conversationId 
 * @returns {Promise<import('$conversationTypes').ConversationContentLogModel[]>}
 */
export async function GetContentLogs(conversationId) {
    let url = replaceUrl(endpoints.loggingContentLogUrl, {conversationId: conversationId});
    const response = await axios.get(url);
    return response.data;
}

/**
 * Get conversation state log
 * @param {string} conversationId 
 * @returns {Promise<import('$conversationTypes').ConversationStateLogModel[]>}
 */
export async function GetStateLogs(conversationId) {
    let url = replaceUrl(endpoints.loggingStateLogUrl, {conversationId: conversationId});
    const response = await axios.get(url);
    return response.data;
}