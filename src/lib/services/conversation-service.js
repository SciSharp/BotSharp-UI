import { replaceUrl } from '$lib/helpers/http';
import axios from 'axios';
import { endpoints } from './api-endpoints.js';
import { conversationUserStateStore } from '$lib/helpers/store.js';

/**
 * New conversation
 * @param {string} agentId 
 * @param {Promise<import('$conversationTypes').MessageConfig>} [config]
 * @returns {Promise<import('$conversationTypes').ConversationModel>}
 */
export async function newConversation(agentId, config) {
    let url = replaceUrl(endpoints.conversationInitUrl, {agentId: agentId});
    const response = await axios.post(url, config ?? {});
    return response.data;
}

/**
 * Get conversation detail
 * @param {string} id
 * @returns {Promise<import('$conversationTypes').ConversationModel>}
 */
export async function getConversation(id) {
    let url = replaceUrl(endpoints.conversationDetailUrl, {conversationId: id});
    const response = await axios.get(url);
    return response.data;
}

/**
 * Get conversation user
 * @param {string} id
 * @returns {Promise<import('$userTypes').UserModel>}
 */
export async function getConversationUser(id) {
    let url = replaceUrl(endpoints.conversationUserUrl, {conversationId: id});
    const response = await axios.get(url);
    return response.data;
}

/**
 * Get conversation list
 * @param {import('$conversationTypes').ConversationFilter} filter
 * @returns {Promise<import('$commonTypes').PagedItems<import('$conversationTypes').ConversationModel>>}
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
    conversationUserStateStore.resetOne(conversationId);
    const response = await axios.delete(url);
    return response.data;
}

/**
 * Get dialog history
 * @param {string} conversationId 
 * @returns {Promise<import('$conversationTypes').ChatResponseModel[]>}
 */
export async function getDialogs(conversationId) {
    let url = replaceUrl(endpoints.dialogsUrl, {conversationId: conversationId});
    const response = await axios.get(url);
    return response.data;
}

/**
 * send a message to the hub
 * @param {string} agentId - The agent id
 * @param {string} conversationId - The conversation id
 * @param {string} text - The text message sent to CSR
 * @param {import('$conversationTypes').MessageData?} data - Additional data
 */
export async function sendMessageToHub(agentId, conversationId, text, data = null) {
    let url = replaceUrl(endpoints.conversationMessageUrl, {
        agentId: agentId,
        conversationId: conversationId
    });
    const userStates = buildConversationUserStates(conversationId);
    const totalStates = !!data?.states && data?.states?.length > 0 ? [...data.states, ...userStates] : [...userStates];
    const response = await axios.post(url, {
        text: text,
        states: totalStates,
        postback: data?.postback,
        input_message_id: data?.inputMessageId
    });
    return response.data;
}

/**
 * pin a conversation to dashboard
 * @param {string} agentId - The agent id
 * @param {string} conversationId - The conversation id
 */
export async function pinConversationToDashboard(agentId, conversationId) {
    let url = replaceUrl(endpoints.pinConversationUrl, {
        agentId: agentId,
        conversationId: conversationId
    });
    const response = await axios.put(url);
    return response.data;
}

/**
 * unpin a conversation from dashboard
 * @param {string} agentId - The agent id
 * @param {string} conversationId - The conversation id
 */
export async function unpinConversationFromDashboard(agentId, conversationId) {
    let url = replaceUrl(endpoints.pinConversationUrl, {
        agentId: agentId,
        conversationId: conversationId
    });
    const response = await axios.delete(url);
    return response.data;
}

/**
 * update a dashboard conversation instuction
 * @param {import('$userTypes').DashboardConversation} dashConv - The instruction
 */
export async function updateDashboardConversation(dashConv) {
    let url = endpoints.dashConversationInstructionUrl;
    const response = await axios.post(url, dashConv);
    return response.data;
}


/**
 * send a notification to conversation
 * @param {string} conversationId - The conversation id
 * @param {string} text - The text message sent to CSR
 * @param {import('$conversationTypes').MessageData?} data - Additional data
 */
export async function sendNotification(conversationId, text, data = null) {
    let url = replaceUrl(endpoints.notificationUrl, {
        conversationId: conversationId
    });
    const response = await axios.post(url, {
        text: text,
        states: [],
        postback: data?.postback
    });
    return response.data;
}

/**
 * @param {string} conversationId
 */
function buildConversationUserStates(conversationId) {
    const userStates = conversationUserStateStore.get(conversationId);
    if (!!userStates && userStates.conversationId == conversationId) {
        // @ts-ignore
        const states = userStates.states?.map(state => {
            return {
                key: state.key.data,
                value: state.value.data,
                active_rounds: state.active_rounds.data || -1
            };
        }) || [];
        conversationUserStateStore.resetOne(conversationId);
        return states;
    }
    return [];
}

/**
 * delete a message in conversation
 * @param {string} conversationId The conversation id
 * @param {string} messageId The target message id to delete
 * @param {boolean} isNewMessage If sending a new message while deleting a message
 * @returns {Promise<string>}
 */
export async function deleteConversationMessage(conversationId, messageId, isNewMessage = false) {
    let url = replaceUrl(endpoints.conversationMessageDeletionUrl, {
        conversationId: conversationId,
        messageId: messageId
    });

    return new Promise((resolve, reject) => {
        axios.delete(url, {
            data: {
                is_new_message: isNewMessage || false
            }
        }).then(response => {
            resolve(response.data);
        }).catch(err => {
            reject(err)
        });
    });
}

/**
 * delete a message in conversation
 * @param {string} conversationId The conversation id
 * @param {import('$conversationTypes').UpdateTagsRequest} request
 * @returns {Promise<boolean>}
 */
export async function updateConversationTags(conversationId, request) {
    let url = replaceUrl(endpoints.conversationTagsUpdateUrl, {
        conversationId: conversationId
    });

    const data = {
        tags: request.tags || []
    };

    return new Promise((resolve, reject) => {
        axios.put(url, {...data}).then(response => {
            resolve(response.data);
        }).catch(err => {
            reject(err)
        });
    });
}

/**
 * delete a message in conversation
 * @param {string} conversationId The conversation id
 * @param {import('$conversationTypes').UpdateBotMessageRequest} request
 * @returns {Promise<boolean>}
 */
export async function updateConversationMessage(conversationId, request) {
    let url = replaceUrl(endpoints.conversationMessageUpdateUrl, {
        conversationId: conversationId
    });

    const data = {
        message: request.message,
        inner_index: request.innerIndex
    };

    return new Promise((resolve, reject) => {
        axios.put(url, {...data}).then(response => {
            resolve(response.data);
        }).catch(err => {
            reject(err)
        });
    });
}


/**
 * upload conversation files
 * @param {string} agentId The agent id
 * @param {string} converationId The conversation id
 * @param {any[]} files The conversation files
 * @returns {Promise<string>}
 */
export async function uploadConversationFiles(agentId, converationId, files) {
    let url = replaceUrl(endpoints.fileUploadUrl, {
        agentId: agentId,
        conversationId: converationId
    });
    const response = await axios.post(url, {
        files: files
    });
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

/** @type {import('axios').CancelTokenSource | null} */
let getConversationStatKeyCancelToken = null;
/**
 * get conversation state key list
 * @param {string} query
 * @returns {Promise<{id: string, name: string}[]>}
 */
export async function getConversationStateKey(query) {
    let url = endpoints.conversationStateKeyListUrl;
    if (getConversationStatKeyCancelToken) {
        getConversationStatKeyCancelToken.cancel();
    }
    getConversationStatKeyCancelToken = axios.CancelToken.source();
    const response = await axios.get(url, {
        params: {
            searchKey: query
        },
        cancelToken: getConversationStatKeyCancelToken.token
    });
    return response.data;
}