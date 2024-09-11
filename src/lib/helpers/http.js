import axios from 'axios';
import { getUserStore, loaderStore } from '$lib/helpers/store.js';

// Add a request interceptor to attach authentication tokens or headers
axios.interceptors.request.use(
    (config) => {
        // Add your authentication logic here
        let user = getUserStore();
        if (!skipLoader(config)) {
            loaderStore.set(true);
        }
        // For example, attach an authentication token to the request headers
        if (user.token)
            config.headers.Authorization = `Bearer ${user.token}`;
        return config;
    },
    (error) => {
        loaderStore.set(false);
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 errors globally
axios.interceptors.response.use(
    (response) => {
        // If the request was successful, return the response
        loaderStore.set(false);
        return response;
    },
    (error) => {
        loaderStore.set(false);
        let user = getUserStore();

        if (Date.now() / 1000 > user.expires) {
            error.response = {status: 401};
        }

        // If the error status is 401, handle it here
        if (error.response && error.response.status === 401) {
            // Perform actions like redirecting to the login page or refreshing tokens
            // Example: redirect to the login page
            const curUrl = window.location.pathname + window.location.search;
            let loginUrl = 'login';
            if (curUrl) {
                loginUrl += `?redirect=${encodeURIComponent(curUrl)}`;
            }
            window.location.href = loginUrl;
        }

        // Return the error to the calling function
        return Promise.reject(error);
    }
);

/** @param {import('axios').InternalAxiosRequestConfig<any>} config */
function skipLoader(config) {
    const postRegexes = [
        new RegExp('http(s*)://(.*?)/conversation/(.*?)/(.*?)', 'g'),
        new RegExp('http(s*)://(.*?)/agent', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/page', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/(.*?)/search', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/create', 'g')
    ];

    const putRegexes = [
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/update', 'g'),
    ];

    const deleteRegexes = [
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/delete-collection', 'g'),
    ];

    const getRegexes = [
        new RegExp('http(s*)://(.*?)/setting/(.*?)', 'g'),
        new RegExp('http(s*)://(.*?)/user/me', 'g'),
        new RegExp('http(s*)://(.*?)/plugin/menu', 'g'),
        new RegExp('http(s*)://(.*?)/address/options(.*?)', 'g'),
        new RegExp('http(s*)://(.*?)/conversation/(.*?)/files/(.*?)', 'g'),
        new RegExp('http(s*)://(.*?)/llm-provider/(.*?)/models', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/vector/collections', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/document/(.*?)/list', 'g')
    ];

    if (config.method === 'post' && !!config.data && postRegexes.some(regex => regex.test(config.url || ''))) {
        return true;
    }

    if (config.method === 'put' && !!config.data && putRegexes.some(regex => regex.test(config.url || ''))) {
        return true;
    }

    if (config.method === 'delete' && !!config.data && deleteRegexes.some(regex => regex.test(config.url || ''))) {
        return true;
    }

    if (config.method === 'get' && getRegexes.some(regex => regex.test(config.url || ''))) {
        return true;
    }

    return false;
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
    return text.replace(/(?:\r\n|\r|\n)/g, '<br>');
}

/**
 * Replace unnecessary markdown
 * @param {string} text 
 * @returns {string}
 */
export function replaceMarkdown(text) {
    let res = text.replace(/#([\s]+)/g, '\\# ').replace(/[-|=]{3,}/g, '');

    let regex1 = new RegExp('\\*(.*)\\*', 'g');
    let regex2 = new RegExp('\\*([\\*]+)\\*', 'g');

    if (!regex1.test(text) || regex2.test(text)) {
        res = res.replace(/\*/g, '\\*');
    }

    return res;
}