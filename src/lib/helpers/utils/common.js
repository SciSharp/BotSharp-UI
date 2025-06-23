import { goto } from '$app/navigation';

export function range(size = 3, startAt = 0) {
    return [...Array(size).keys()].map((i) => i + startAt);
};

export const durationUnitRegex = /[a-zA-Z]/;

/**
 * @param {string} baseUrl
 * @param {string} relativePath
 */
export function buildUrl(baseUrl, relativePath) {
    return new URL(relativePath, baseUrl);
}

/** @param {string} agentId */
export function directToAgentPage(agentId) {
    if (!agentId) return;
        
    window.open(`/page/agent/${agentId}`);
}

/** @param {string} url */
export function isExternalUrl(url) {
    if (!url) return false;

    return /^(https?:\/\/)/.test(url)
}

/** @param {any} object */
export function formatObject(object) {
    let res = {};
    if (!object) return res;

    try {
        for (const [key, value] of Object.entries(object)) {
            let newValue;
            try {
                newValue = JSON.parse(value);
            } catch {
                newValue = value;
            }
    
            res = {
                ...res,
                [key]: newValue
            };
        }
    
        return res;
    } catch {
        return object;
    }
}


/**
 * @param {string | null | undefined} str
 * @param {string | null | undefined} prefix
 */
export function truncateByPrefix(str, prefix) {
    if (!str || !prefix) {
        return str;
    }

    if (!str.startsWith(prefix)) {
        return str;
    }

    return str.replace(prefix, '');
}


/**
 * @param {any[]} arr
 * @param {string | number} key
 */
export function removeDuplicates(arr, key) {
    return [...new Map(arr.map(item => [item[key], item])).values()];
}

/**
 * @param {(string | null)[]} args
 */
export const classnames = (...args) => args.filter(Boolean).join(' ');


/**
 * @param {{ page: number | string | null, pageSize: number | string | null }} args
 * @param {{ defaultPageSize: number, maxPageSize?: number }} defaults
 */
export function getPagingQueryParams(args, defaults = { defaultPageSize: 12, maxPageSize: 30 }) {
    const pNum = Number(args.page);
    const pSize = Number(args.pageSize);
    const pageNum = pNum > 0 ? pNum : 1;
    const pageSizeNum = pSize > 0 ? Math.min(pSize, defaults.maxPageSize || 30) : defaults.defaultPageSize;

    return {
        pageNum,
        pageSizeNum
    };
}

/**
 * @param {URL} url
 * @param {import('$commonTypes').KeyValuePair[]} pairs
 * @param {() => void} [callback]
 */
export function setUrlQueryParams(url, pairs, callback) {
    if (!pairs?.length) {
        return;
    }

    pairs?.map(p => {
        url.searchParams.set(p.key, p.value);
    });
    
    callback?.();
}

/**
 * @param {string} url
 * @param {boolean} replaceState
 */
export function goToUrl(url, replaceState = true) {
    goto(url, { replaceState: replaceState });
}
