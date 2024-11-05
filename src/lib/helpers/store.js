// @ts-nocheck
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const userKey = "user";
const conversationKey = "conversation";
const conversationUserStatesKey = "conversation_user_states";
const conversationSearchOptionKey = "conversation_search_option";
const conversationUserMessageKey = "conversation_user_messages";

/** @type {Writable<import('$commonTypes').GlobalEvent>} */
export const globalEventStore = writable({ name: "", payload: {} });


/** @type {Writable<import('$userTypes').UserModel>} */
export const userStore = writable({ id: "", full_name: "", expires: 0, token: null });

/**
 * @returns {Writable<import('$userTypes').UserModel>}
 */
export function getUserStore() {
    if (browser) {
        // Access localStorage only if in the browser context
        let json = localStorage.getItem(userKey);
        if (json)
            return JSON.parse(json);
        else
            return userStore;
    } else {
        // Return a default value for SSR
        return userStore;
    }
};

userStore.subscribe(value => {
    if (browser && value.token) {
        localStorage.setItem(userKey, JSON.stringify(value));
    }
});


const createConversationStore = () => {
    const { subscribe } = writable({});
    return {
        clear: (/** @type {string | null} */ convId = null) => {
            if (!convId) {
                localStorage.removeItem(conversationKey);
                return;
            }

            const json = localStorage.getItem(conversationKey);
            if (json) {
                const conv = JSON.parse(json);
                if (conv.id === convId) {
                    localStorage.removeItem(conversationKey);
                }
            }
        },
        get: () => {
            const json = localStorage.getItem(conversationKey);
            return json ? JSON.parse(json) : {};
        },
        put: (value) => {
            localStorage.setItem(conversationKey, JSON.stringify(value));
        },
        subscribe
    };
};

export const conversationStore = createConversationStore();


const createLoaderStore = () => {
    const { subscribe, set } = writable(false);
    return {
        subscribe,
        set
    };
}

export const loaderStore = createLoaderStore();


const createConversationUserStateStore = () => {
    return {
        resetAll: () => {
            localStorage.removeItem(conversationUserStatesKey);
        },
        resetOne: (conversationId) => {
            const json = localStorage.getItem(conversationUserStatesKey);
            const content = json ? JSON.parse(json) : {};
            const data = content?.data || [];
            const found = data.find(x => x.conversationId === conversationId);
            if (!found) return;

            const updated = data.filter(x => x.conversationId !== conversationId);
            localStorage.setItem(conversationUserStatesKey, JSON.stringify({ data: updated }));
        },
        get: (conversationId) => {
            const json = localStorage.getItem(conversationUserStatesKey);
            const content = json ? JSON.parse(json) : {};
            const found = content?.data?.find(x => x.conversationId === conversationId);
            return found || {};
        },
        put: (value) => {
            const conversationId = value?.conversationId;
            const json = localStorage.getItem(conversationUserStatesKey);
            const content = json ? JSON.parse(json) : {};
            const cur = content?.data?.filter(x => x.conversationId !== conversationId) || [];
            const updated = [ ...cur, { ...value } ];
            localStorage.setItem(conversationUserStatesKey, JSON.stringify({ data: updated }));
        }
    }
};

export const conversationUserStateStore = createConversationUserStateStore();


const createConversationSearchOptionStore = () => {
    return {
        reset: () => {
            localStorage.removeItem(conversationSearchOptionKey);
        },
        get: () => {
            const json = localStorage.getItem(conversationSearchOptionKey);
            return json ? JSON.parse(json) : {};
        },
        put: (value) => {
            localStorage.setItem(conversationSearchOptionKey, JSON.stringify(value));
        }
    }
};

export const conversationSearchOptionStore = createConversationSearchOptionStore();


const createConversationUserMessageStore = () => {
    return {
        reset: () => {
            localStorage.removeItem(conversationUserMessageKey);
        },
        get: () => {
            const json = localStorage.getItem(conversationUserMessageKey);
            return json ? JSON.parse(json) : {};
        },
        put: (value) => {
            localStorage.setItem(conversationUserMessageKey, JSON.stringify(value));
        }
    }
};

export const conversationUserMessageStore = createConversationUserMessageStore();


const createConversationUserAttachmentStore = () => {
    const { subscribe, set } = writable({ accepted_files: [] });

    return {
        reset: () => {
            const data = { accepted_files: [] };
            set({ ...data });
        },
        put: (value) => {
            set(value);
        },
        subscribe
    }
};

export const conversationUserAttachmentStore = createConversationUserAttachmentStore();


const createKnowledgeBaseDocumentStore = () => {
    const { subscribe, set } = writable({ accepted_files: [] });

    return {
        reset: () => {
            const data = { accepted_files: [] };
            set({ ...data });
        },
        put: (value) => {
            set(value);
        },
        subscribe
    }
};

export const knowledgeBaseDocumentStore = createKnowledgeBaseDocumentStore();


export function resetLocalStorage(resetUser = false) {
    conversationUserStateStore.resetAll();
    conversationUserMessageStore.reset();
    conversationUserAttachmentStore.reset();
    localStorage.removeItem('conversation');

    if (resetUser) {
        localStorage.removeItem('user');
    }
}