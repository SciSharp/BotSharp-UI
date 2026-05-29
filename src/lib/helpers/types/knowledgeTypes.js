// Knowledgebase
/**
 * @typedef {Object} CreateVectorCollectionRequest
 * @property {string} collectionName - The collection name.
 * @property {string} provider - The text embedding provider.
 * @property {string} model - The text embedding model.
 * @property {number} dimension - The text embedding dimension.
 */

/**
 * @typedef {Object} KnowledgeQueryRequest
 * @property {string} text - The text.
 * @property {string[]} [fields] - Data fields.
 * @property {number} [limit] - Data limit.
 * @property {number} [confidence] - Confidence.
 * @property {boolean} [withVector] - Include vector or not.
 * @property {VectorFilterGroup[]} [filterGroups] - Search filter groups.
 * @property {any} [searchParam] - Search params.
 * @property {string[]?} [dataProviders] - Data providers
 */

/**
 * @typedef {Object} KnowledgeFilter
 * @property {string | null} [start_id] - The start id.
 * @property {number} size - Page size.
 * @property {boolean} [withVector] - Include vector or not.
 * @property {string[]} [fields] - Included payload fields.
 * @property {VectorFilterGroup[]} [filterGroups] - Search filter groups.
 * @property {VectorSort?} [orderBy] - Sort by.
 */

// /**
//  * @typedef {Object} VectorSearchParam
//  * @property {boolean?} [exact_search] - Exact search or not.
//  */

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
 * @typedef {Object} KnowledgeQueryViewModel
 * @property {string} id - The knowledge data id.
 * @property {any} payload - The knowledge payload.
 * @property {any} data - The knowledge payload.
 * @property {number} [score] - The knowledge score.
 * @property {number[]} [vector] - The knowledge vector.
 * @property {number} [vector_dimension] - The vector dimension.
 */

/**
 * @typedef {Object} KnowledgeSearchPageResult
 * @property {number} count - The total data count.
 * @property {KnowledgeQueryViewModel[]} items - The data items.
 * @property {string} [next_id] - The next id.
 */

/**
 * @typedef {Object} VectorKnowledgeUploadRequest
 * @property {import('$fileTypes').FileModel[]} files - The files.
 * @property {any} [options]
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

/**
 * @typedef {Object} EntityAnalysisRequest
 * @property {string} text
 * @property {string?} [provider]
 * @property {EntityAnalysisOptions?} [options]
 */

/**
 * @typedef {Object} EntityAnalysisOptions
 * @property {string[]?} [data_providers]
 * @property {number?} [max_ngram]
 * @property {number?} [cutoff]
 * @property {number?} [top_k]
 */

/**
 * @typedef {Object} EntityAnalysisResponse
 * @property {EntityAnalysisResult[]} [results]
 * @property {boolean?} [success]
 * @property {string?} [error_message]
 */

/**
 * @typedef {Object} EntityAnalysisResult
 * @property {string} token
 * @property {string?} [canonical_text]
 * @property {any} data
 */

export default {};