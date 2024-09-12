// Knowledgebase
/**
 * @typedef {Object} CreateVectorCollectionRequest
 * @property {string} collection_name - The collection name.
 * @property {string} collection_type - The collection type.
 * @property {string} provider - The text embedding provider.
 * @property {string} model - The text embedding model.
 * @property {number} dimension - The text embedding dimension.
 */

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
 * @property {string[]} [included_payloads] - Included payload keys.
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

/**
 * @typedef {Object} VectorKnowledgeUploadRequest
 * @property {import('$fileTypes').FileModel[]} files - The files.
 */

/**
 * @typedef {Object} UploadKnowledgeResponse
 * @property {string[]} success - The success files.
 * @property {string[]} failed - The failed files.
 * @property {boolean} is_success
 */

export default {};