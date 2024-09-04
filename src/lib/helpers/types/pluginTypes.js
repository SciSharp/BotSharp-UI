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
 * @property {boolean} isHeader
 */

/**
 * @typedef {Object} PluginFilter
 * @property {import('$commonTypes').Pagination} pager - Pagination
 */

export default {};