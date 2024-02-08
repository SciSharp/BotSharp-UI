import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const conversationKey = "conversation";
export const conversationUserStatesKey = "conversation_user_states";

/** @type {Writable<import('$types').UserModel>} */
export const userStore = writable({ id: "", full_name: "" });

/**
 * @returns {Writable<import('$types').UserModel>}
 */
export function getUserStore () {
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

export const globalLoaderStore = writable(false);

/**
 * @param {boolean} value
 */
export function setGlobalLoad(value){
    globalLoaderStore.set(value);
}

/** @type {Writable<import('$types').ConversationModel>}*/
export const conversationStore = writable({});

/**
 * @returns {Writable<import('$types').ConversationModel>}
 */
export function getConversationStore() {
    if (browser) {
        // Access localStorage only if in the browser context
        const json = localStorage.getItem(conversationKey);
        if (!!json)
            return JSON.parse(json);
        else
            return conversationStore;
    } else {
        // Return a default value for SSR
        return conversationStore;
    }
};

conversationStore.subscribe(value => {
    if (browser && value.id) {
        localStorage.setItem(conversationKey, JSON.stringify(value));
        localStorage.removeItem(conversationUserStatesKey);
    }
});



/** @type {Writable<import('$types').ConversationUserStateModel>}*/
export const conversationUserStateStore = writable({});

/**
 * @returns {Writable<import('$types').ConversationUserStateModel>}
 */
export function getConversationUserStateStore() {
    if (!!browser) {
        const json = localStorage.getItem(conversationUserStatesKey);
        if (!!json)
            return JSON.parse(json);
        else
            return conversationUserStateStore;
    } else {
        return conversationUserStateStore;
    }
};

conversationUserStateStore.subscribe(value => {
    if (!!browser && !!value.conversationId) {
        localStorage.setItem(conversationUserStatesKey, JSON.stringify(value));
    }
});