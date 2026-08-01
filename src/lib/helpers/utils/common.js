import { goto } from '$app/navigation';
import { openAppRoute } from './desktop';
import moment from 'moment';
import { TIME_RANGE_OPTIONS, CUSTOM_DATE_RANGE } from '../constants';
import { TimeRange } from '../enums';

export function range(size = 3, startAt = 0) {
    return [...Array(size).keys()].map((i) => i + startAt);
};

/**
 * Format an integer using the user's locale digit-grouping rules (e.g.,
 * 1234567 → "1,234,567" in en-US, "1.234.567" in de-DE).
 * Falls back to an empty string when the value is null/undefined/NaN.
 *
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatNumber(value) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '';
    }
    return new Intl.NumberFormat().format(value);
}

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

    openAppRoute(`/page/agent/${agentId}`);
}

/** @param {string} url */
export function isExternalUrl(url) {
    if (!url) return false;

    return /^(https?:\/\/)/.test(url)
}

/**
 * The run id in an autoplay live-view link, or null for any other URL.
 *
 * These arrive as ordinary markdown links in agent messages ("Watch this run"), pointing at
 * `<publicBaseUrl>/run/<runId>?t=<token>` on the executor container. Nothing in the payload
 * marks them as special and the base URL is the container's, not ours, so shape is all there
 * is to match on: an app that wants to treat a live run differently from a cited article has
 * to recognise it here. The token matters to the match — it is what makes the URL a live
 * session handed to a person rather than a bare path someone typed.
 *
 * Heuristic by nature. If the executor changes its live-view route, this stops matching and
 * the link degrades to a normal external link rather than breaking.
 *
 * @param {URL} url
 * @returns {string | null}
 */
export function liveRunId(url) {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.searchParams.get('t')) return null;

    const match = /^\/run\/([^/]+)\/?$/.exec(url.pathname);
    return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Absolute URLs in a run of text. Stops at whitespace, at the quote and angle characters
 * that would mean the URL is embedded in something else, and at `)` — which is not a
 * character a live-view URL contains but IS what closes the markdown link these arrive in.
 */
const urlPattern = /https?:\/\/[^\s)"'<>]+/g;

/**
 * The run id of a live-view link inside a message, or null when the message has none.
 *
 * The counterpart to `liveRunId` for text that has not been parsed into links yet: a
 * message is only ever a string of markdown until Markdown.svelte renders it, so anything
 * that wants to reason about a message BEING a live view — rather than about a link
 * someone clicked — has to look for the URL itself.
 *
 * Same heuristic and the same failure mode: an executor that changes its live-view route
 * stops matching here too, and such a message then reads as ordinary prose.
 *
 * @param {string | null | undefined} text
 * @returns {string | null}
 */
export function liveRunIdInText(text) {
    if (!text) return null;

    for (const match of text.matchAll(urlPattern)) {
        let url;
        try {
            url = new URL(match[0]);
        } catch {
            // Something URL-shaped that isn't a URL. It cannot be a live view either.
            continue;
        }

        const runId = liveRunId(url);
        if (runId) return runId;
    }

    return null;
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
 * @param {(args0: URL) => void} [callback]
 */
export function setUrlQueryParams(url, pairs, callback) {
    if (!pairs?.length) {
        return;
    }

    url.search = '';
    pairs?.map(p => {
        url.searchParams.set(p.key, p.value);
    });
    
    callback?.(url);
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
 * @param {HTMLElement | null | undefined} container
 * @param {ScrollBehavior} behavior
 */
export function scrollToBottom(container, behavior = 'smooth') {
    if (container) {
        setTimeout(() => {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: behavior
            });
        }, 0);
    }
}

/**
 * @param {string} str
 * @param {string} separator
 */
export function splitTextByCase(str, separator = '_') {
    if (!str) return str;

    let words = str.split(separator);
    if (words.length === 1) {
        // split by camel case
        words = str.split(/(?=[A-Z])/);
    }

    let text = words.map(word => word.toLowerCase()).join(' ');
    text = text.charAt(0).toUpperCase() + text.slice(1);
    return text;
}

/**
 * @param {string} url
 */
export function getCleanUrl(url) {
    if (!url) return url;

    if (url.startsWith('/')) {
        url = url.substring(1);
    }

    return url;
}

/**
 * @param {string} timeRange
 * @param {string} [startDate] - When timeRange is "Custom date", start date in YYYY-MM-DD format (e.g. 2026-01-25)
 * @param {string} [endDate] - When timeRange is "Custom date", end date in YYYY-MM-DD format (e.g. 2026-01-30). If not provided, uses startDate
 * @returns {{ startTime: string | null, endTime: string | null }}
 */
export function convertTimeRange(timeRange, startDate, endDate) {
    let ret = { startTime: null, endTime: null };

    if (!timeRange) {
        return ret;
    }

    // Handle CUSTOM_DATE_RANGE first, as it's not in TIME_RANGE_OPTIONS
    if (timeRange === CUSTOM_DATE_RANGE) {
        if (startDate && moment(startDate).isValid()) {
            const endDateToUse = endDate && moment(endDate).isValid() ? endDate : startDate;
            ret = {
                ...ret,
                // @ts-ignore
                startTime: moment(startDate).startOf('day').utc().format(),
                // @ts-ignore
                endTime: moment(endDateToUse).endOf('day').utc().format()
            };
        }
        return ret;
    }

    const found = TIME_RANGE_OPTIONS.find(x => x.value === timeRange);
    if (!found) {
        return ret;
    }

    switch (found.value) {
        case TimeRange.Last15Minutes:
        case TimeRange.Last30Minutes:
        case TimeRange.Last1Hour:
        case TimeRange.Last3Hours:
        case TimeRange.Last12Hours:
        case TimeRange.Last3Days:
        case TimeRange.Last7Days:
        case TimeRange.Last30Days:
        case TimeRange.Last90Days:
        case TimeRange.Last180Days:
        case TimeRange.LastYear:
            ret = {
                ...ret,
                // @ts-ignore
                startTime: moment().subtract(found.qty, found.unit).utc().format()
            };
            break;
        case TimeRange.Today:
            ret = {
                ...ret,
                // @ts-ignore
                startTime: moment().startOf('day').utc().format()
            };
            break;
        case TimeRange.Yesterday:
            ret = {
                ...ret,
                // @ts-ignore
                startTime: moment().subtract(1, 'days').startOf('day').utc().format(),
                // @ts-ignore
                endTime: moment().subtract(1, 'days').endOf('day').utc().format()
            };
            break;
        default:
            break;
    }

    return ret;
}