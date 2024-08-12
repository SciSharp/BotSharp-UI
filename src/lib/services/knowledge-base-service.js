import { replaceUrl } from '$lib/helpers/http.js';
import { endpoints } from './api-endpoints.js';
import axios from 'axios';

/**
 * @param {string} collection
 * @param {import('$types').SearchKnowledgeRequest} request
 */
export async function searchKnowledge(collection, request) {
    const url = replaceUrl(endpoints.knowledgeBaseSearchUrl, {
        collection: collection
    });

    const body = {
        ...request,
        fields: request.fields || ["text", "answer"]
    };
    const response = await axios.post(url, { ...body });
    return response.data;
}

/**
 * @param {string} collection
 * @param {import('$types').KnowledgeFilter} filter
 * @returns {Promise<import('$types').KnowledgeCollectionDataResult>}
 */
export async function getKnowledgeData(collection, filter) {
    const url = replaceUrl(endpoints.knowledgeBaseDataListUrl, {
        collection: collection
    });

    const response = await axios.post(url, { ...filter });
    return response.data;
}


/**
 * @param {string} collection
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteKnowledgeData(collection, id) {
    const url = replaceUrl(endpoints.knowledgeBaseDeleteDataUrl, {
        collection: collection,
        id: id
    });

    const response = await axios.delete(url);
    return response.data;
}


/**
 * Upload document to knowledge base.
 * @param {string} collection
 * @param {File} file
 * @param {number | undefined} [startPageNum]
 * @param {number | undefined} [endPageNum]
 */
export async function uploadKnowledge(collection, file, startPageNum, endPageNum) {
    const url = replaceUrl(endpoints.knowledgeBaseUploadUrl, {
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