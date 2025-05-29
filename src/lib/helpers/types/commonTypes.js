/**
 * @typedef {Object} Pagination
 * @property {number} page - The plugin full name.
 * @property {number} size - The plugin name.
 * @property {number} count - Row count.
 */

/**
 * @typedef {Object} KeyValuePair
 * @property {string} key - The key.
 * @property {string} value - The value.
 */

/**
 * @typedef {Object} IdName
 * @property {string?} id - The id.
 * @property {string} name - The name.
 */

/**
 * @typedef {Object} LabelValuePair
 * @property {string} label - The label.
 * @property {string} value - The value.
 */

/**
 * @template T
 * @typedef {Object} PagedItems<T>
 * @property {number} count - Row count.
 * @property {T[]} items - Items.
 */

/**
 * @template T
 * @typedef {Object} DateTimePagedItems<T>
 * @property {number} count - Row count.
 * @property {T[]} items - Items.
 * @property {Date?} [nextTime]
 */

/**
 * @typedef {Object} LlmConfigOption
 * @property {number?} [type]
 * @property {boolean?} [multiModal]
 * @property {boolean?} [imageGeneration]
 */

/**
 * @typedef {Object} LlmConfig
 * @property {string} provider
 * @property {LlmModelSetting[]} models
 */

/**
 * @typedef {Object} LlmModelSetting
 * @property {string} name
 * @property {string} type
 */


/**
 * @typedef {Object} GlobalEvent
 * @property {string} name
 * @property {any} payload
 */

/**
 * @typedef {Object} NameBase
 * @property {string} name
 * @property {string?} [displayName]
 */

export default {};