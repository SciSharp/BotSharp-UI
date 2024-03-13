// @ts-nocheck
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const conversationKey = "conversation";
const conversationUserStatesKey = "conversation_user_states";
const conversationSearchOptionKey = "conversation_search_option";
const conversationUserMessageKey = "conversation_user_messages";

/** @type {Writable<import('$types').UserModel>} */
export const userStore = writable({ id: "", full_name: "", expires: 0, token: null });

/**
 * @returns {Writable<import('$types').UserModel>}
 */
export function getUserStore() {
    if (browser) {
        // Access localStorage only if in the browser context
        let json = localStorage.getItem('user');
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
        localStorage.setItem('user', JSON.stringify(value));
    }
});


/** @type {Writable<import('$types').ConversationModel>}*/
export const conversationStore = writable({});

/**
 * @returns {Writable<import('$types').ConversationModel>}
 */
export function getConversationStore() {
    if (browser) {
        // Access localStorage only if in the browser context
        const json = localStorage.getItem(conversationKey);
        if (json)
            return JSON.parse(json);
        else
            return conversationStore;
    } else {
        // Return a default value for SSR
        return conversationStore;
    }
};

// @ts-ignore
conversationStore.subscribe(value => {
    if (browser && value.id) {
        localStorage.setItem(conversationKey, JSON.stringify(value));
        const state = conversationUserStateStore.get();
        if (state && state.conversationId != value.id) {
            conversationUserStateStore.reset();
        }
    }
});



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
        reset: () => {
            localStorage.removeItem(conversationUserStatesKey);
        },
        get: () => {
            const json = localStorage.getItem(conversationUserStatesKey);
            return json ? JSON.parse(json) : {};
        },
        put: (value) => {
            localStorage.setItem(conversationUserStatesKey, JSON.stringify(value));
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