import { endpoints } from './api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http';
import axios from 'axios';
import { conversationUserStateStore } from '$lib/helpers/store.js';

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
    const response = await axios.get(url, { params: filter,
        paramsSerializer: {
            dots: true
        }
    });
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
 * @param {string} truncateMsgId The message id to be deleted
 * @param {string[]} states The states to be set
 */
export async function sendMessageToHub(agentId, conversationId, message, truncateMsgId = '', states = []) {
    let url = replaceUrl(endpoints.conversationMessageUrl, {
        agentId: agentId,
        conversationId: conversationId
    });
    const userStates = buildConversationUserStates(conversationId);
    const totalStates = states?.length > 0 ? [...states, ...userStates] : [...userStates];
    const response = await axios.post(url, {
        text: message,
        truncateMessageId: truncateMsgId,
        states: totalStates
    });
    return response.data;
}


/**
 * @param {string} conversationId
 */
function buildConversationUserStates(conversationId) {
    const userStates = conversationUserStateStore.get();
    if (!!userStates && userStates.conversationId == conversationId && !!userStates.states) {
        // @ts-ignore
        const states = userStates.states.map(state => {
            return `${state.key.data}=${state.value.data}`;
        });
        return states;
    }
    return [];
}

/**
 * delete a message in conversation
 * @param {string} conversationId The conversation id
 * @param {string} messageId The text message sent to CSR
 */
export async function deleteConversationMessage(conversationId, messageId) {
    let url = replaceUrl(endpoints.conversationMessageDeletionUrl, {
        conversationId: conversationId,
        messageId: messageId
    });
    const response = await axios.delete(url);
    return response.data;
}