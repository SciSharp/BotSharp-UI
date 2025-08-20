import { replaceUrl } from '$lib/helpers/http.js';
import { endpoints } from './api-endpoints.js';
import axios from 'axios';


/**
 * @param {string} collection
 * @returns {Promise<boolean>}
 */
export async function existVectorCollection(collection) {
    const url = replaceUrl(endpoints.vectorCollectionExistUrl, {
        collection: collection
    });

    const response = await axios.get(url);
    return response.data;
}

/**
 * @param {string?} type
 * @returns {Promise<import('$knowledgeTypes').VectorCollectionConfig[]>}
 */
export async function getVectorKnowledgeCollections(type = null) {
    const url = endpoints.vectorCollectionsUrl;
    const response = await axios.get(url, {
        params: {
            type: type
        }
    });
    return response.data;
}

/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').SearchKnowledgeRequest} request
 * @returns {Promise<import('$knowledgeTypes').KnowledgeSearchViewModel[]>}
 */
export async function searchVectorKnowledge(collection, request) {
    const url = replaceUrl(endpoints.vectorKnowledgeSearchUrl, {
        collection: collection
    });

    const response = await axios.post(url, { ...request });
    return response.data;
}

/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').KnowledgeFilter} filter
 * @returns {Promise<import('$knowledgeTypes').KnowledgeSearchPageResult>}
 */
export async function getVectorKnowledgePageList(collection, filter) {
    const url = replaceUrl(endpoints.vectorKnowledgePageListUrl, {
        collection: collection
    });

    const response = await axios.post(url, { ...filter });
    return response.data;
}

/**
 * @param {string} collection
 * @param {string} text
 * @param {any} payload
 * @returns {Promise<boolean>}
 */
export async function createVectorKnowledgeData(collection, text, payload = null) {
    const url = replaceUrl(endpoints.vectorKnowledgeCreateUrl, {
        collection: collection
    });

    const request = {
        text: text,
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
 * @returns {Promise<boolean>}
 */
export async function updateVectorKnowledgeData(id, collection, text, payload = null) {
    const url = replaceUrl(endpoints.vectorKnowledgeUpdateUrl, {
        collection: collection
    });

    const request = {
        id: id,
        text: text,
        payload: {
            ...payload
        }
    };

    const response = await axios.put(url, { ...request });
    return response.data;
}


/**
 * @param {string} collection
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteVectorKnowledgeData(collection, id) {
    const url = replaceUrl(endpoints.vectorKnowledgeDeleteUrl, {
        collection: collection,
        id: id
    });

    const response = await axios.delete(url);
    return response.data;
}

/**
 * @param {string} collection
 * @returns {Promise<boolean>}
 */
export async function deleteAllVectorKnowledgeData(collection) {
    const url = replaceUrl(endpoints.vectorKnowledgeDeleteAllUrl, {
        collection: collection
    });

    const response = await axios.delete(url);
    return response.data;
}

/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').VectorKnowledgeUploadRequest} request
 * @returns {Promise<import('$knowledgeTypes').UploadKnowledgeResponse>}
 */
export async function uploadKnowledgeDocuments(collection, request) {
    const url = replaceUrl(endpoints.knowledgeDocumentUploadUrl, {
        collection: collection
    });

    const response = await axios.post(url, {
        ...request
    });
    return response.data;
}

/**
 * @param {string} collection
 * @param {string} fileId
 * @returns {Promise<boolean>}
 */
export async function deleteKnowledgeDocument(collection, fileId) {
    const url = replaceUrl(endpoints.knowledgeDocumentDeleteUrl, {
        collection: collection,
        fileId: fileId
    });

    const response = await axios.delete(url);
    return response.data;
}

/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').KnowledgeDocRequest} request
 * @returns {Promise<boolean>}
 */
export async function deleteAllKnowledgeDocuments(collection, request) {
    const url = replaceUrl(endpoints.knowledgeDocumentDeleteAllUrl, {
        collection: collection
    });

    const response = await axios.delete(url, { data: { ...request } });
    return response.data;
}


/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').KnowledgeDocRequest} request
 * @returns {Promise<import('$knowledgeTypes').KnowledgeDocPagedResult>}
 */
export async function getKnowledgeDocumentPageList(collection, request) {
    const url = replaceUrl(endpoints.knowledgeDocumentPageListUrl, {
        collection: collection
    });

    const response = await axios.post(url, { ...request });
    return response.data;
}


/**
 * @param {import('$knowledgeTypes').CreateVectorCollectionRequest} request
 * @returns {Promise<boolean>}
 */
export async function createVectorCollection(request) {
    const url = endpoints.vectorCollectionCreateUrl;
    const response = await axios.post(url, { ...request });
    return response.data;
}

/**
 * @param {string} collection
 * @returns {Promise<boolean>}
 */
export async function deleteVectorCollection(collection) {
    const url = replaceUrl(endpoints.vectorCollectionDeleteUrl, {
        collection: collection
    });

    const response = await axios.delete(url);
    return response.data;
}


/**
 * @param {string} text
 * @param {string } method
 * @returns {Promise<any>}
 */
export async function searchGraphKnowledge(text, method = "local") {
    const url = endpoints.graphKnowledgeSearchUrl;
    const response = await axios.post(url, { query: text, method: method });
    return response.data;
}

/**
 * @param {string} collection
 * @returns {Promise<import('$knowledgeTypes').VectorCollectionDetails>}
 */
export async function getVectorCollectionDetails(collection) {
    const url = replaceUrl(endpoints.vectorCollectionDetailsUrl, {
        collection: collection
    });

    const response = await axios.get(url);
    return response.data;
}

/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').VectorCollectionIndexOptions[]} options
 * @returns {Promise<import('$commonTypes').SuccessFailResponse>}
 */
export async function createVectorIndexes(collection, options) {
    const url = replaceUrl(endpoints.vectorIndexesCreateUrl, {
        collection: collection
    });

    const response = await axios.post(url, {
        options: options || []
    });
    return response.data;
}

/**
 * @param {string} collection
 * @param {import('$knowledgeTypes').VectorCollectionIndexOptions[]} options
 * @returns {Promise<import('$commonTypes').SuccessFailResponse>}
 */
export async function deleteVectorIndexes(collection, options) {
    const url = replaceUrl(endpoints.vectorIndexesDeleteUrl, {
        collection: collection
    });

    const response = await axios.delete(url, {
        data: {
            options: options || []
        }
    });
    return response.data;
}