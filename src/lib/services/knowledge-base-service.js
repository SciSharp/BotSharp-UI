import { replaceUrl } from '$lib/helpers/http.js';
import { endpoints } from './api-endpoints.js';
import axios from 'axios';

/**
 * @param {string} type
 * @returns {Promise<string[]>}
 */
export async function getVectorKnowledgeCollections(type) {
    const url = endpoints.vectorKnowledgeCollectionsUrl;
    const response = await axios.get(url, {
        params: {
            type: type
        }
    });
    return response.data;
}

/**
 * @param {import('$knowledgeTypes').SearchKnowledgeRequest} request
 * @param {string} collection
 * @returns {Promise<import('$knowledgeTypes').KnowledgeSearchViewModel[]>}
 */
export async function searchVectorKnowledge(request, collection) {
    const url = replaceUrl(endpoints.vectorKnowledgeSearchUrl, {
        collection: collection
    });

    const response = await axios.post(url, { ...request });
    return response.data;
}

/**
 * @param {import('$knowledgeTypes').KnowledgeFilter} filter
 * @param {string} collection
 * @returns {Promise<import('$knowledgeTypes').KnowledgeSearchPageResult>}
 */
export async function getPagedVectorKnowledgeData(filter, collection) {
    const url = replaceUrl(endpoints.vectorKnowledgePageDataUrl, {
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
            ...payload
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
 * @param {string} id
 * @param {string} collection
 * @returns {Promise<boolean>}
 */
export async function deleteVectorKnowledgeData(id, collection) {
    const url = replaceUrl(endpoints.vectorKnowledgeDeleteUrl, {
        collection: collection,
        id: id
    });

    const response = await axios.delete(url);
    return response.data;
}


/**
 * Upload document to knowledge base.
 * @param {File} file
 * @param {string | null} [collection]
 * @param {number | null} [startPageNum]
 * @param {number | null} [endPageNum]
 */
export async function uploadVectorKnowledge(file, collection = null, startPageNum = null, endPageNum = null) {
    const url = replaceUrl(endpoints.vectorKnowledgeUploadUrl, {
        collection: collection
    });

    const formData = new FormData();
    formData.append("file", file);

    if (startPageNum) {
        formData.append("startPageNum", startPageNum.toString());
    }

    if (endPageNum) {
        formData.append("endPageNum", endPageNum.toString());
    }

    const config = {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    };

    const response = await axios.post(url, formData, config);
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