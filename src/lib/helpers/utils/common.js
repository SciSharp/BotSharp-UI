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