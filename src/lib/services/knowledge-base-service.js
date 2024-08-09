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