// Knowledgebase
/**
 * @typedef {Object} SearchKnowledgeRequest
 * @property {string} text - The text.
 * @property {string[]} [fields] - Data fields.
 * @property {number} [limit] - Data limit.
 * @property {number} [confidence] - Confidence.
 * @property {boolean} [with_vector] - Include vector or not.
 */

/**
 * @typedef {Object} KnowledgeFilter
 * @property {string | null} [start_id] - The start id.
 * @property {number} size - Page size.
 * @property {boolean} [with_vector] - Include vector or not.
 * @property {{ key: string, value: string }[]} [search_pairs] - Search pairs.
 */

/**
 * @typedef {Object} KnowledgeSearchViewModel
 * @property {string} id - The knowledge data id.
 * @property {any} data - The knowledge data.
 * @property {number} [score] - The knowledge score.
 * @property {number[]} [vector] - The knowledge vector.
 */

/**
 * @typedef {Object} KnowledgeSearchPageResult
 * @property {number} count - The total data count.
 * @property {KnowledgeSearchViewModel[]} items - The data items.
 * @property {string} [next_id] - The next id.
 */

export default {};