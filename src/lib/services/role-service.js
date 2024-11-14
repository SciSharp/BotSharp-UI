import { endpoints } from './api-endpoints.js';
import axios from 'axios';

/**
 * Get role options
 * @returns {Promise<string[]>}
 */
export async function getRoleOptions() {
    const response = await axios.get(endpoints.roleOptionsUrl);
    return response.data;
}





/**
 * Get user detail
 * @param {string} id
 * @returns {Promise<import('$roleTypes').RoleModel>}
 */
export async function getRoleDetails(id) {
    const url = endpoints.roleDetailUrl.replace("{id}", id);
    const response = await axios.get(url);
    return response.data;
}
