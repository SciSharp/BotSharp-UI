import axios from 'axios';
import { getUserStore, globalErrorStore, loaderStore } from '$lib/helpers/store.js';
import { renewToken } from '$lib/services/auth-service';
import { delay } from './utils/common';


/** @type {{config: import('axios').InternalAxiosRequestConfig, resolve: (value: any) => void, reject: (reason?: any) => void}[]} */
const retryQueue = [];

// Refresh handling state
let isRefreshingToken = false;

/**
 * Wrap renewToken into a Promise that resolves with the new access token string
 * @param {string} token
 * @returns {Promise<string>}
 */
function refreshAccessToken(token) {
    return new Promise((resolve, reject) => {
        renewToken(token, (newToken) => resolve(newToken), () => reject(new Error('Failed to refresh token')));
    });
}


// Add a request interceptor to attach authentication tokens or headers
axios.interceptors.request.use(
    (config) => {
        // Add your authentication logic here
        const user = getUserStore();
        if (!skipLoader(config)) {
            loaderStore.set(true);
        }
        // Attach an authentication token to the request headers
        if (user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
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
        loaderStore.set(false);
        return response;
    },
    (error) => {
        loaderStore.set(false);
        const originalRequest = error?.config;

        // If token expired or 401 returned, attempt a single token refresh and retry requests in queue.
        if ((error?.response?.status === 401 || isTokenExired()) && originalRequest) {
            return new Promise((resolve, reject) => {
                enqueue({ config: originalRequest, resolve, reject });
            });
        } else if (!skipGlobalError(originalRequest)) {
            globalErrorStore.set(true);
            setTimeout(() => {
                globalErrorStore.set(false);
            }, 2500);
        }

        // Return the error to the calling function
        return Promise.reject(error);
    }
);

/** 
 * @param {{config: import('axios').InternalAxiosRequestConfig, resolve: (value: any) => void, reject: (reason?: any) => void}} retryItem 
 */
function enqueue(retryItem) {
    // Push the current request into the queue
    retryQueue.push({ ...retryItem });

    // Start refresh token
    if (!isRefreshingToken) {
        isRefreshingToken = true;
        const user = getUserStore();

        refreshAccessToken(user?.token || '')
            .then((newToken) => {
                isRefreshingToken = false;
                const promise = dequeue(newToken);
                return promise;
            })
            .catch((err) => {
                isRefreshingToken = false;
                // Reject all queued requests
                while (retryQueue.length > 0) {
                    const item = retryQueue.shift();
                    if (item) {
                        item.reject(err);
                    }
                }
                redirectToLogin();
            });
    }
}

/**
 * Retry queued requests sequentially
 * @param {string} newToken
 * @returns {Promise<void>}
 */
function dequeue(newToken) {
    let chain = Promise.resolve();
    while (retryQueue.length > 0) {
        const item = retryQueue.shift();
        if (!item) continue;
        const { config, resolve, reject } = item;
        // @ts-ignore
        config.headers = config.headers || {};
        // @ts-ignore
        config.headers.Authorization = `Bearer ${newToken}`;
        chain = chain.then(() => delay(20))
                     .then(() => { axios(config).then(resolve).catch(reject); });
    }
    return chain;
}

function isTokenExired() {
    const user = getUserStore();
    return Date.now() / 1000 > user.expires;
}

function redirectToLogin() {
    const curUrl = window.location.pathname + window.location.search;
    let loginUrl = 'login';
    if (curUrl) {
        loginUrl += `?redirect=${encodeURIComponent(curUrl)}`;
    }
    window.location.href = loginUrl;
}

/** @param {import('axios').InternalAxiosRequestConfig<any>} config */
function skipLoader(config) {
    /** @type {RegExp[]} */
    const postRegexes = [
        new RegExp('http(s*)://(.*?)/conversation/(.*?)/(.*?)', 'g'),
        new RegExp('http(s*)://(.*?)/agent', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/page', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/(.*?)/search', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/create', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/document/(.*?)/page', 'g'),
        new RegExp('http(s*)://(.*?)/users', 'g'),
        new RegExp('http(s*)://(.*?)/instruct/chat-completion', 'g'),
        new RegExp('http(s*)://(.*?)/agent/(.*?)/code-scripts', 'g'),
        new RegExp('http(s*)://(.*?)/agent/(.*?)/code-script/generate', 'g')
    ];

    /** @type {RegExp[]} */
    const putRegexes = [
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/update', 'g'),
        new RegExp('http(s*)://(.*?)/conversation/(.*?)/update-message', 'g'),
        new RegExp('http(s*)://(.*?)/conversation/(.*?)/update-tags', 'g'),
        new RegExp('http(s*)://(.*?)/users', 'g'),
    ];

    /** @type {RegExp[]} */
    const deleteRegexes = [
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/delete-collection', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/data/(.*?)', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/data', 'g'),
    ];

    /** @type {RegExp[]} */
    const getRegexes = [
        new RegExp('http(s*)://(.*?)/setting/(.*?)', 'g'),
        new RegExp('http(s*)://(.*?)/user/me', 'g'),
        new RegExp('http(s*)://(.*?)/plugin/menu', 'g'),
        new RegExp('http(s*)://(.*?)/address/options(.*?)', 'g'),
        new RegExp('http(s*)://(.*?)/conversation/(.*?)/files/(.*?)', 'g'),
        new RegExp('http(s*)://(.*?)/llm-provider/(.*?)/models', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/vector/collections', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/exist', 'g'),
        new RegExp('http(s*)://(.*?)/role/options', 'g'),
        new RegExp('http(s*)://(.*?)/role/(.*?)/details', 'g'),
        new RegExp('http(s*)://(.*?)/user/(.*?)/details', 'g'),
        new RegExp('http(s*)://(.*?)/agent/labels', 'g'),
        new RegExp('http(s*)://(.*?)/conversation/state/keys', 'g'),
        new RegExp('http(s*)://(.*?)/logger/instruction/log/keys', 'g'),
        new RegExp('http(s*)://(.*?)/logger/conversation/(.*?)/content-log', 'g'),
        new RegExp('http(s*)://(.*?)/logger/conversation/(.*?)/state-log', 'g'),
        new RegExp('http(s*)://(.*?)/mcp/server-configs', 'g'),
        new RegExp('http(s*)://(.*?)/agent/(.*?)/code-scripts', 'g')
    ];

    if (config.method === 'post' && postRegexes.some(regex => regex.test(config.url || ''))) {
        return true;
    }

    if (config.method === 'put' && putRegexes.some(regex => regex.test(config.url || ''))) {
        return true;
    }

    if (config.method === 'delete' && deleteRegexes.some(regex => regex.test(config.url || ''))) {
        return true;
    }

    if (config.method === 'get' && getRegexes.some(regex => regex.test(config.url || ''))) {
        return true;
    }

    return false;
}

/** @param {import('axios').InternalAxiosRequestConfig<any>} config */
function skipGlobalError(config) {
    /** @type {RegExp[]} */
    const postRegexes = [
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/page', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/(.*?)/search', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/create', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/document/(.*?)/page', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/vector/create-collection', 'g'),
        new RegExp('http(s*)://(.*?)/refresh-agents', 'g')
    ];

    /** @type {RegExp[]} */
    const putRegexes = [
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/update', 'g'),
        new RegExp('http(s*)://(.*?)/role', 'g'),
        new RegExp('http(s*)://(.*?)/user', 'g'),
        new RegExp('http(s*)://(.*?)/conversation/(.*?)/update-message', 'g'),
        new RegExp('http(s*)://(.*?)/conversation/(.*?)/update-tags', 'g')
    ];

    /** @type {RegExp[]} */
    const deleteRegexes = [
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/delete-collection', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/data/(.*?)', 'g'),
        new RegExp('http(s*)://(.*?)/knowledge/vector/(.*?)/data', 'g'),
    ];

    /** @type {RegExp[]} */
    const getRegexes = [];

    if (config.method === 'post' && postRegexes.some(regex => regex.test(config.url || ''))) {
        return true;
    }

    if (config.method === 'put' && putRegexes.some(regex => regex.test(config.url || ''))) {
        return true;
    }

    if (config.method === 'delete' && deleteRegexes.some(regex => regex.test(config.url || ''))) {
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
        // @ts-ignore
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
    let res = text.replace(/#([\s]+)/g, '\\# ').replace(/[-|=]{3,}/g, '@@@');

    let regex1 = new RegExp('\\*(.*)\\*', 'g');
    let regex2 = new RegExp('\\*([\\*]+)\\*', 'g');

    if (!regex1.test(text) || regex2.test(text)) {
        res = res.replace(/\*/g, '\\*');
    }

    return res;
}