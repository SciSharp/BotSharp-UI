import { endpoints } from './api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http';
import axios from 'axios';

/**
 * New conversation
 * @param {string} agentId 
 * @returns {Promise<import('$types').ConversationModel>}
 */
export async function newConversation(agentId) {
    let url = replaceUrl(endpoints.conversationInitUrl, {agentId: agentId});
    const response = await axios.post(url, {});
    return response.data;
}

/**
 * Get conversation detail
 * @param {string} id
 * @returns {Promise<import('$types').ConversationModel>}
 */
export async function getConversation(id) {
    let url = replaceUrl(endpoints.conversationDetailUrl, {conversationId: id});
    const response = await axios.get(url);
    return response.data;
}

/**
 * Get conversation list
 * @param {import('$types').ConversationFilter} filter
 * @returns {Promise<import('$types').PagedItems<import('$types').ConversationModel>>}
 */
export async function getConversations(filter) {
    let url = endpoints.conversationsUrl;
    const response = await axios.post(url, { ...filter });
    return response.data;
}

/**
 * Delete conversation
 * @param {string} conversationId 
 */
export async function deleteConversation(conversationId) {
    let url = replaceUrl(endpoints.conversationDeletionUrl, {conversationId: conversationId});
    const response = await axios.delete(url);
    return response.data;
}

/**
 * Get dialog history
 * @param {string} conversationId 
 * @returns {Promise<import('$types').ChatResponseModel[]>}
 */
export async function GetDialogs(conversationId) {
    let url = replaceUrl(endpoints.dialogsUrl, {conversationId: conversationId});
    const response = await axios.get(url);
    return response.data;
}

/**
 * send a message to the hub
 * @param {string} agentId The agent id
 * @param {string} conversationId The conversation id
 * @param {string} message The text message sent to CSR
 */
export async function sendMessageToHub(agentId, conversationId, message) {
    let url = replaceUrl(endpoints.conversationMessageUrl, {
        agentId: agentId,
        conversationId: conversationId});
    const response = await axios.post(url, {
        "text": message
    });
    return response.data;
}
