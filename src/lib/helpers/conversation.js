import { conversationUserStateStore } from "./store";

/**
 * @param {string} conversationId
 * @returns {import('$conversationTypes').ConversationStateModel[]}
 */
export function buildConversationUserStates(conversationId) {
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
        // conversationUserStateStore.resetOne(conversationId);
        return states;
    }
    return [];
}