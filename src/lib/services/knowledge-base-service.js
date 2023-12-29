import { endpoints } from './api-endpoints.js';
import { setAuthorization, replaceUrl } from '$lib/helpers/http';
import axios from 'axios';

/**
 * Upload document to knowledge base.
 * @param {File} file
 */
export async function uploadDocument(file) {
    setAuthorization();
    let url = endpoints.knowledgeBaseUploadUrl;

    const formData = new FormData();
    formData.append("file", file);

    let config = {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    };

    const response = await axios.post(url, formData, config);
    return response.data;
}