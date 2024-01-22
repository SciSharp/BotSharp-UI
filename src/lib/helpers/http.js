import axios from 'axios';
import { getUserStore } from '$lib/helpers/store.js';

// Add a request interceptor to attach authentication tokens or headers
axios.interceptors.request.use(
    (config) => {
      // Add your authentication logic here
      let user = getUserStore();
      let headers = axios.defaults.headers;
      // For example, attach an authentication token to the request headers
      config.headers.Authorization = `Bearer ${user.token}`;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 errors globally
axios.interceptors.response.use(
    (response) => {
      // If the request was successful, return the response
      return response;
    },
    (error) => {
      // If the error status is 401, handle it here
      if (error.response && error.response.status === 401) {
        // Perform actions like redirecting to the login page or refreshing tokens
        // Example: redirect to the login page
        window.location.href = '/login';
      }
  
      // Return the error to the calling function
      return Promise.reject(error);
    }
);

/**
 * @param {String} url
 * @param {Object} args
 * @returns {String}
 */
export function replaceUrl(url, args) {
    const keys = Object.keys(args);
    keys.forEach(key => {
        url = url.replace("{" + key + "}", args[key]);
    });
    return url;
}

/**
 * Replace new line as <br>
 * @param {string} text 
 * @returns string
 */
export function replaceNewLine(text) {
    return text.replace(/(?:\r\n|\r|\n)/g, '<br>');
}
