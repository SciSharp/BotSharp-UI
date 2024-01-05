import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/** @type {Writable<import('$types').UserModel>} */
export const userStore = writable({ id: "" });

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