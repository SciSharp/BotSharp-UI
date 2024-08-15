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
 * @param {string | null} [collection]
 * @returns {Promise<import('$types').KnowledgeSearchViewModel[]>}
 */
export async function searchVectorKnowledge(request, collection = null) {
    const url = replaceUrl(endpoints.vectorKnowledgeSearchUrl, {
        collection: collection || DEFAULT_KNOWLEDGE_COLLECTION
    });

    const response = await axios.post(url, { ...request });
    return response.data;
}

/**
 * @param {import('$types').KnowledgeFilter} filter
 * @param {string | null} [collection]
 * @returns {Promise<import('$types').KnowledgeSearchPageResult>}
 */
export async function getVectorKnowledgeData(filter, collection = null) {
    const url = replaceUrl(endpoints.vectorKnowledgeDataListUrl, {
        collection: collection || DEFAULT_KNOWLEDGE_COLLECTION
    });

    const response = await axios.post(url, { ...filter });
    return response.data;
}


/**
 * @param {string} id
 * @param {string | null} [collection]
 * @returns {Promise<boolean>}
 */
export async function deleteVectorKnowledgeData(id, collection = null) {
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