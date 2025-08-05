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
export function classnames(...args) {
    return args.filter(Boolean).join(' ');
}

/**
 * @param {number} milliseconds
 */
export function delay(milliseconds = 100) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve('');
        }, milliseconds);
    });
};

/**
 * @param {{ page: any, pageSize: any }} args
 * @param {{ defaultPageSize: number, maxPageSize?: number }} defaults
 */
export function getPagingQueryParams(args, defaults = { defaultPageSize: 12, maxPageSize: 30 }) {
    const pNum = Number(args.page) || 0;
    const pSize = Number(args.pageSize) || 0;
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
 * @param {{ replaceState?: boolean, noScroll?: boolean }} [opts]
 */
export function goToUrl(url, opts = {}) {
    const { replaceState = true, noScroll = true } = opts;
    goto(url, { replaceState, noScroll });
}

/**
 * @param {string} str
 */
export function splitTextByCase(str) {
    if (!str) return str;

    let words = str.split("_");
    if (words.length === 0) {
        // split by camel case
        words = str.split(/(?=[A-Z])/);
    }

    let text = words.map(word => word.toLowerCase()).join(' ');
    text = text.charAt(0).toUpperCase() + text.slice(1);
    return text;
}