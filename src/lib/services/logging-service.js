import { endpoints } from './api-endpoints.js';
import axios from 'axios';

/**
 * Show backend full log
 */
export async function getFullLog() {
    axios({
        url: endpoints.loggingFullLogUrl,
        method: 'GET',
        responseType: 'blob'
    }).then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        link.remove();
    })
}