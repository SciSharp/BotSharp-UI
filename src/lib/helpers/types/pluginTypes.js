/**
 * @typedef {Object} PluginDefModel
 * @property {string} id - The plugin full name.
 * @property {string} name - The plugin name.
 * @property {string} description - The plugin description.
 * @property {string} assembly - The plugin assembly.
 * @property {boolean} is_core
 * @property {string} icon_url
 * @property {string} [settings_name]
 * @property {string[]} agent_ids
 * @property {boolean} enabled
 */

/**
 * @typedef {Object} PluginMenuDefModel
 * @property {string} label
 * @property {string} icon
 * @property {string} link
 * @property {EmbeddingInfoModel?} [embeddingInfo]
 * @property {boolean} isHeader
 * @property {PluginMenuDefModel[]} subMenu
 */

/**
 * @typedef {Object} EmbeddingInfoModel
 * @property {string} source
 * @property {string?} [scriptSrc]
 * @property {string?} [scriptType]
 * @property {string?} [url]
 * @property {string?} [htmlTag]
 * @property {string?} [htmlStyle]
 * @property {string?} [appendTokenName]
 */

/**
 * @typedef {Object} PluginFilter
 * @property {import('$commonTypes').Pagination} pager - Pagination
 * @property {string[]} [names] - The plugin names
 * @property {string} [similarName] - The plugin similar name
 */

export default {};