import { endpoints } from './api-endpoints.js';
import { replaceUrl } from '$lib/helpers/http';
import axios from 'axios';
import { conversationUserStateStore } from '$lib/helpers/store.js';

/**
 * New conversation
 * @param {string} agentId 
 * @param {Promise<import('$types').MessageConfig>} [config]
 * @returns {Promise<import('$types').ConversationModel>}
 */
export async function newConversation(agentId, config) {
    let url = replaceUrl(endpoints.conversationInitUrl, {agentId: agentId});
    const response = await axios.post(url, config ?? {});
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
 * Get conversation user
 * @param {string} id
 * @returns {Promise<import('$types').UserModel>}
 */
export async function getConversationUser(id) {
    let url = replaceUrl(endpoints.conversationUserUrl, {conversationId: id});
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
    const response = await axios.post(url, { ...filter});
    return response.data;
}

/**
 * Get conversation files
 * @param {string} conversationId
 * @param {string} messageId
 * @param {string} source
 */
export async function getConversationFiles(conversationId, messageId, source) {
    const url = replaceUrl(endpoints.conversationAttachmentUrl, { conversationId: conversationId, messageId: messageId, source: source });
    const response = await axios.get(url);
    return response?.data;
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
 * @param {string} agentId - The agent id
 * @param {string} conversationId - The conversation id
 * @param {string} message - The text message sent to CSR
 * @param {import('$types').MessageData?} data - Additional data
 * @param {any[]} files - The chat files
 */
export async function sendMessageToHub(agentId, conversationId, message, data = null, files = []) {
    let url = replaceUrl(endpoints.conversationMessageUrl, {
        agentId: agentId,
        conversationId: conversationId
    });
    const userStates = buildConversationUserStates(conversationId);
    const totalStates = !!data?.states && data?.states?.length > 0 ? [...data.states, ...userStates] : [...userStates];
    const response = await axios.post(url, {
        text: message,
        truncateMessageId: data?.truncateMsgId,
        states: totalStates,
        postback: data?.postback,
        files: files
    });
    return response.data;
}


/**
 * @param {string} conversationId
 */
function buildConversationUserStates(conversationId) {
    const userStates = conversationUserStateStore.get();
    if (!!userStates && userStates.conversationId == conversationId && userStates.states?.length > 0) {
        // @ts-ignore
        const states = userStates.states.map(state => {
            return {
                key: state.key.data,
                value: state.value.data,
                active_rounds: state.active_rounds.data || -1
            };
        });
        conversationUserStateStore.reset();
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


/**
 * delete a message in conversation
 * @param {string} text The user input
 */
export async function getAddressOptions(text) {
    const url = endpoints.addressUrl;
    const response = await axios.get(url, {
        params: {
            address:  text
        }
    });
    return response.data;
}