export function range(size = 3, startAt = 0) {
    return [...Array(size).keys()].map((i) => i + startAt);
};

/**
 * @param {string} baseUrl
 * @param {string} relativePath
 */
export function buildUrl(baseUrl, relativePath) {
    return new URL(relativePath, baseUrl);
}