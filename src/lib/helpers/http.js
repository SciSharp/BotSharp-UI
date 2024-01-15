import axios from 'axios';
import { getUserStore } from '$lib/helpers/store.js';

/**
 * Set axios http headers globally
 */
export function setAuthorization() {
    let user = getUserStore();
    let headers = axios.defaults.headers;
    headers.common['Authorization'] = `Bearer ${user.token}`;
}

/**
 * @param {String} url
 * @param {Object} args
 * @returns {String}
 */
export function replaceUrl(url, args) {
    const keys = Object.keys(args);
    keys.forEach(key => {
        url = url.replace("{" + key + "}", args[key]);
    });
    return url;
}

/**
 * Replace new line as <br>
 * @param {string} text 
 * @returns string
 */
export function replaceNewLine(text) {
    return text.replace(/\\r\\n/g, '<br>');
}