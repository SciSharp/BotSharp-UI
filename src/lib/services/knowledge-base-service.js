import { KNOWLEDGE_COLLECTION } from '$lib/helpers/constants.js';
import { replaceUrl } from '$lib/helpers/http.js';
import { endpoints } from './api-endpoints.js';
import axios from 'axios';

/**
 * @param {import('$types').SearchKnowledgeRequest} request
 * @param {string | null} [collection]
 * @returns {Promise<import('$types').KnowledgeRetrivalViewModel[]>}
 */
export async function searchKnowledge(request, collection = null) {
    const url = replaceUrl(endpoints.knowledgeBaseSearchUrl, {
        collection: collection || KNOWLEDGE_COLLECTION
    });

    const body = {
        ...request,
        fields: request.fields || ["text", "answer"]
    };
    const response = await axios.post(url, { ...body });
    return response.data;
}

/**
 * @param {import('$types').KnowledgeFilter} filter
 * @param {string | null} [collection]
 * @returns {Promise<import('$types').KnowledgeCollectionDataResult>}
 */
export async function getKnowledgeData(filter, collection = null) {
    const url = replaceUrl(endpoints.knowledgeBaseDataListUrl, {
        collection: collection || KNOWLEDGE_COLLECTION
    });

    const response = await axios.post(url, { ...filter });
    return response.data;
}


/**
 * @param {string} id
 * @param {string | null} [collection]
 * @returns {Promise<boolean>}
 */
export async function deleteKnowledgeData(id, collection = null) {
    const url = replaceUrl(endpoints.knowledgeBaseDeleteDataUrl, {
        collection: collection || KNOWLEDGE_COLLECTION,
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
export async function uploadKnowledge(file, collection = null, startPageNum = null, endPageNum = null) {
    const url = replaceUrl(endpoints.knowledgeBaseUploadUrl, {
        collection: collection || KNOWLEDGE_COLLECTION
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