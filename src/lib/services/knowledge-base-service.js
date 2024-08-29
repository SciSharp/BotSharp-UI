import { DEFAULT_KNOWLEDGE_COLLECTION } from '$lib/helpers/constants.js';
import { replaceUrl } from '$lib/helpers/http.js';
import { endpoints } from './api-endpoints.js';
import axios from 'axios';

/**
 * @returns {Promise<string[]>}
 */
export async function getVectorKnowledgeCollections() {
    const url = endpoints.vectorKnowledgeCollectionsUrl;
    const response = await axios.get(url);
    return response.data;
}

/**
 * @param {import('$types').SearchKnowledgeRequest} request
 * @param {string} collection
 * @returns {Promise<import('$types').KnowledgeSearchViewModel[]>}
 */
export async function searchVectorKnowledge(request, collection) {
    const url = replaceUrl(endpoints.vectorKnowledgeSearchUrl, {
        collection: collection || DEFAULT_KNOWLEDGE_COLLECTION
    });

    const response = await axios.post(url, { ...request });
    return response.data;
}

/**
 * @param {import('$types').KnowledgeFilter} filter
 * @param {string} collection
 * @returns {Promise<import('$types').KnowledgeSearchPageResult>}
 */
export async function getPagedVectorKnowledgeData(filter, collection) {
    const url = replaceUrl(endpoints.vectorKnowledgePageDataUrl, {
        collection: collection || DEFAULT_KNOWLEDGE_COLLECTION
    });

    const response = await axios.post(url, { ...filter });
    return response.data;
}

/**
 * @param {string} text
 * @param {string} answer
 * @param {string} collection
 * @returns {Promise<boolean>}
 */
export async function createVectorKnowledgeData(text, answer, collection) {
    const url = replaceUrl(endpoints.vectorKnowledgeCreateUrl, {
        collection: collection || DEFAULT_KNOWLEDGE_COLLECTION
    });

    const request = {
        text: text,
        payload: {
            answer: answer
        }
    };

    const response = await axios.post(url, { ...request });
    return response.data;
}

/**
 * @param {string} id
 * @param {string} text
 * @param {string} answer
 * @param {string} collection
 * @returns {Promise<boolean>}
 */
export async function updateVectorKnowledgeData(id, text, answer, collection) {
    const url = replaceUrl(endpoints.vectorKnowledgeUpdateUrl, {
        collection: collection || DEFAULT_KNOWLEDGE_COLLECTION
    });

    const request = {
        id: id,
        text: text,
        payload: {
            answer: answer
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
        collection: collection || DEFAULT_KNOWLEDGE_COLLECTION,
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
        collection: collection || DEFAULT_KNOWLEDGE_COLLECTION
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
 * @param {string} collection
 * @param {number} dimension
 * @returns {Promise<boolean>}
 */
export async function createVectorCollection(collection, dimension) {
    const url = replaceUrl(endpoints.vectorCollectionCreateUrl, {
        collection: collection,
        dimension: dimension
    });

    const response = await axios.post(url);
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

    // const response = await axios.delete(url);
    // return response.data;

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, 1500);
    });
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