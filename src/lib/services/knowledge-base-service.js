import { replaceUrl } from '$lib/helpers/http.js';
import { endpoints } from './api-endpoints.js';
import axios from 'axios';


/**
 * @param {string} collection
 * @param {string} knowledgeType
 * @param {string?} dbProvider
 * @returns {Promise<boolean>}
 */
export async function existKnowledgeCollection(collection, knowledgeType, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeCollectionExistUrl, {
        collection: collection
    });

    const response = await axios.get(url, {
        params: {
            knowledgeType: knowledgeType,
            dbProvider: dbProvider
        }
    });
    return response.data;
}

/**
 * @param {string?} knowledgeType
 * @param {string?} dbProvider
 * @returns {Promise<import('$knowledgeTypes').VectorCollectionConfig[]>}
 */
export async function getKnowledgeCollections(knowledgeType = null, dbProvider = null) {
    const url = endpoints.knowledgeCollectionsUrl;
    const response = await axios.get(url, {
        params: {
            knowledgeType: knowledgeType,
            dbProvider: dbProvider
        }
    });
    return response.data;
}

/**
 * @param {string} collection
 * @param {string} knowledgeType
 * @param {string?} dbProvider
 * @returns {Promise<import('$knowledgeTypes').VectorCollectionDetails>}
 */
export async function getKnowledgeCollectionDetails(collection, knowledgeType, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeCollectionDetailsUrl, {
        collection: collection
    });

    const response = await axios.get(url, {
        params: {
            knowledgeType: knowledgeType,
            dbProvider: dbProvider
        }
    });
    return response.data;
}

/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').KnowledgeQueryRequest} request
 * @param {string} knowledgeType
 * @param {string?} dbProvider
 * @returns {Promise<import('$knowledgeTypes').KnowledgeQueryViewModel[]>}
 */
export async function executeKnowledgeQuery(collection, request, knowledgeType, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeDataQueryUrl, {
        collection: collection
    });

    const response = await axios.post(url, {
        ...request,
        knowledgeType: knowledgeType,
        dbProvider: dbProvider
    });
    return response.data;
}

/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').KnowledgeFilter} filter
 * @param {string} knowledgeType
 * @param {string?} dbProvider
 * @returns {Promise<import('$knowledgeTypes').KnowledgeSearchPageResult>}
 */
export async function getKnowledgePageList(collection, filter, knowledgeType, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeDataPageListUrl, {
        collection: collection
    });

    const response = await axios.post(url, {
        ...filter,
        knowledgeType: knowledgeType,
        dbProvider: dbProvider
    });
    return response.data;
}

/**
 * @param {string} collection
 * @param {string} text
 * @param {any} payload
 * @param {string} knowledgeType
 * @param {string?} dbProvider
 * @returns {Promise<boolean>}
 */
export async function createKnowledgeData(collection, text, payload, knowledgeType, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeDataCreateUrl, {
        collection: collection
    });

    const request = {
        text: text,
        knowledgeType: knowledgeType,
        dbProvider: dbProvider,
        payload: {
            ...payload,
        }
    };

    const response = await axios.post(url, { ...request });
    return response.data;
}

/**
 * @param {string} id
 * @param {string} collection
 * @param {string} text
 * @param {any} payload
 * @param {string} knowledgeType
 * @param {string?} dbProvider
 * @returns {Promise<boolean>}
 */
export async function updateKnowledgeData(id, collection, text, payload, knowledgeType, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeDataUpdateUrl, {
        collection: collection
    });

    const request = {
        id: id,
        knowledgeType: knowledgeType,
        dbProvider: dbProvider,
        text: text,
        payload: {
            ...payload
        }
    };

    const response = await axios.put(url, { ...request });
    return response.data;
}


/**
 * @param {string} id
 * @param {string} collection
 * @param {string} knowledgeType
 * @param {string?} dbProvider
 * @returns {Promise<boolean>}
 */
export async function deleteKnowledgeData(id, collection, knowledgeType, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeDataDeleteUrl, {
        collection: collection,
        id: id
    });

    const response = await axios.delete(url, {
        data: {
            knowledgeType: knowledgeType,
            dbProvider: dbProvider
        }
    });
    return response.data;
}

/**
 * @param {string} collection
 * @param {string} knowledgeType
 * @param {string?} dbProvider
 * @returns {Promise<boolean>}
 */
export async function deleteAllKnowledgeData(collection, knowledgeType, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeDataDeleteAllUrl, {
        collection: collection
    });

    const response = await axios.delete(url, {
        data: {
            knowledgeType: knowledgeType,
            dbProvider: dbProvider
        }
    });
    return response.data;
}

/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').VectorKnowledgeUploadRequest} request
 * @param {string?} dbProvider
 * @returns {Promise<import('$knowledgeTypes').UploadKnowledgeResponse>}
 */
export async function uploadKnowledgeFiles(collection, request, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeFileUploadUrl, {
        collection: collection
    });

    const response = await axios.post(url, {
        ...request,
        options: {
            ...request.options || {},
            dbProvider: dbProvider
        }
    });
    return response.data;
}

/**
 * @param {string} collection
 * @param {string} fileId
 * @param {string?} dbProvider
 * @returns {Promise<boolean>}
 */
export async function deleteKnowledgeFile(collection, fileId, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeFileDeleteUrl, {
        collection: collection,
        fileId: fileId
    });

    const response = await axios.delete(url, {
        data: {
            dbProvider: dbProvider
        }
    });
    return response.data;
}

/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').KnowledgeDocRequest} request
 * @param {string?} dbProvider
 * @returns {Promise<boolean>}
 */
export async function deleteAllKnowledgeFiles(collection, request, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeFileDeleteAllUrl, {
        collection: collection
    });

    const response = await axios.delete(url, {
        data: {
            ...request,
            dbProvider: dbProvider
        }
    });
    return response.data;
}


/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').KnowledgeDocRequest} request
 * @param {string?} dbProvider
 * @returns {Promise<import('$knowledgeTypes').KnowledgeDocPagedResult>}
 */
export async function getKnowledgeFilePageList(collection, request, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeFilePageListUrl, {
        collection: collection
    });

    const response = await axios.post(url, {
        ...request,
        dbProvider: dbProvider
    });
    return response.data;
}

/**
 * @returns {Promise<string[]>}
 */
export async function getKnowledgeProcessors() {
    const url = endpoints.knowledgeProcessorsUrl;
    const response = await axios.get(url);
    return response.data;
}


/**
 * @param {import('$knowledgeTypes').CreateVectorCollectionRequest} request
 * @param {string} knowledgeType
 * @param {string?} dbProvider
 * @returns {Promise<boolean>}
 */
export async function createKnowledgeCollection(request, knowledgeType, dbProvider = null) {
    const url = endpoints.knowledgeCollectionCreateUrl;
    const response = await axios.post(url, {
        ...request,
        knowledgeType: knowledgeType,
        dbProvider: dbProvider
    });
    return response.data;
}

/**
 * @param {string} collection
 * @param {string} knowledgeType
 * @param {string?} dbProvider
 * @returns {Promise<boolean>}
 */
export async function deleteKnowledgeCollection(collection, knowledgeType, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeCollectionDeleteUrl, {
        collection: collection
    });

    const response = await axios.delete(url, {
        data: {
            knowledgeType: knowledgeType,
            dbProvider: dbProvider
        }
    });
    return response.data;
}


/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').VectorCollectionIndexOptions[]} options
 * @param {string} knowledgeType
 * @param {string?} dbProvider
 * @returns {Promise<import('$commonTypes').SuccessFailResponse>}
 */
export async function createKnowledgeIndexes(collection, options, knowledgeType, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeIndexesCreateUrl, {
        collection: collection
    });

    const response = await axios.post(url, {
        knowledgeType: knowledgeType,
        dbProvider: dbProvider,
        options: options || []
    });
    return response.data;
}

/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').VectorCollectionIndexOptions[]} options
 * @param {string} knowledgeType
 * @param {string?} dbProvider
 * @returns {Promise<import('$commonTypes').SuccessFailResponse>}
 */
export async function deleteKnowledgeIndexes(collection, options, knowledgeType, dbProvider = null) {
    const url = replaceUrl(endpoints.knowledgeIndexesDeleteUrl, {
        collection: collection
    });

    const response = await axios.delete(url, {
        data: {
            knowledgeType: knowledgeType,
            dbProvider: dbProvider,
            options: options || []
        }
    });
    return response.data;
}


/**
 * @returns {Promise<string[]>}
 */
export async function getEntityAnalyzers() {
    const url = endpoints.entityAnalyzersUrl;
    const response = await axios.get(url);
    return response.data;
}

/**
 * @returns {Promise<string[]>}
 */
export async function getEntityDataLoaders() {
    const url = endpoints.entityDataProvidersUrl;
    const response = await axios.get(url);
    return response.data;
}