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
 * @param {import('$conversationTypes').ConversationLogFilter} filter
 * @returns {Promise<import('$commonTypes').DateTimePagedItems<import('$conversationTypes').ConversationContentLogModel>>}
 */
export async function getContentLogs(conversationId, filter) {
    let url = replaceUrl(endpoints.loggingContentLogUrl, {conversationId: conversationId});
    const response = await axios.get(url, {
        params: {
            ...filter
        }
    });
    return response.data;
}

/**
 * Get conversation state log
 * @param {string} conversationId
 * @param {import('$conversationTypes').ConversationLogFilter} filter
 * @returns {Promise<import('$commonTypes').DateTimePagedItems<import('$conversationTypes').ConversationStateLogModel>>}
 */
export async function getStateLogs(conversationId, filter) {
    let url = replaceUrl(endpoints.loggingStateLogUrl, {conversationId: conversationId});
    const response = await axios.get(url, {
        params: {
            ...filter
        }
    });
    return response.data;
}