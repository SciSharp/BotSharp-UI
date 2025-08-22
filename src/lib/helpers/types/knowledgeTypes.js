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
 * @property {VectorFilterGroup[]} [filter_groups] - Search filter groups.
 */

/**
 * @typedef {Object} KnowledgeFilter
 * @property {string | null} [start_id] - The start id.
 * @property {number} size - Page size.
 * @property {boolean} [with_vector] - Include vector or not.
 * @property {string[]} [fields] - Included payload fields.
 * @property {VectorFilterGroup[]} [filter_groups] - Search filter groups.
 * @property {VectorSort?} [order_by] - Sort by.
 */

/**
 * @typedef {Object} VectorFilterGroup
 * @property {string} [logical_operator] - The logical operator.
 * @property {VectorFilterSubGroup[]} [filters] - Search filters.
 */

/**
 * @typedef {Object} VectorFilterSubGroup
 * @property {string} [logical_operator] - The logical operator.
 * @property {VectorFilterOperand[]} [operands] - Search operands.
 */

/**
 * @typedef {Object} VectorFilterOperand
 * @property {VectorFilterMatch?} [match] - The match filter.
 * @property {VectorFilterRange?} [range] -The range filter.
 */

/**
 * @typedef {Object} VectorFilterMatch
 * @property {string} key - The field name.
 * @property {string} value - The field value.
 * @property {string} operator - The operator.
 * @property {string} data_type -The field data type.
 */

/**
 * @typedef {Object} VectorFilterRange
 * @property {string} key - The field name.
 * @property {string} data_type -The field data type.
 * @property {VectorFilterRangeCondition[]} conditions -The conditions.
 */

/**
 * @typedef {Object} VectorFilterRangeCondition
 * @property {string} value - The field value.
 * @property {string} operator -The operator.
 */

/**
 * @typedef {Object} VectorSort
 * @property {string?} [field] - The sort field.
 * @property {string?} [order] - The sort order.
 */

/**
 * @typedef {Object} KnowledgeSearchViewModel
 * @property {string} id - The knowledge data id.
 * @property {any} payload - The knowledge payload.
 * @property {number} [score] - The knowledge score.
 * @property {number[]} [vector] - The knowledge vector.
 * @property {number} [vector_dimension] - The vector dimension.
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

/**
 * @typedef {Object} KnowledgeDocRequest
 * @property {number} page
 * @property {number} size
 */

/**
 * @typedef {Object} KnowledgeDocPagedResult
 * @property {import('$fileTypes').KnowledgeFileModel[]} items
 * @property {number} count
 */

/**
 * @typedef {Object} VectorCollectionConfig
 * @property {string} name
 * @property {string} type
 * @property {VectorStoreConfig} vector_store
 * @property {KnowledgeEmbeddingConfig} text_embedding
 */

/**
 * @typedef {Object} VectorStoreConfig
 * @property {string} provider
 */

/**
 * @typedef {Object} KnowledgeEmbeddingConfig
 * @property {string} provider
 * @property {string} model
 * @property {number} dimension
 */

/**
 * @typedef {Object} VectorCollectionDetails
 * @property {string} status
 * @property {number} vectors_count
 * @property {number} points_count
 * @property {PayloadSchemaDetail[]} payload_schema
 */

/**
 * @typedef {Object} PayloadSchemaDetail
 * @property {string} field_name
 * @property {string} field_data_type
 * @property {number} data_count
 */

/**
 * @typedef {Object} VectorCollectionIndexOptions
 * @property {string} field_name
 * @property {string} field_schema_type
 */

export default {};