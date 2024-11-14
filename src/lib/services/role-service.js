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
 * Get role list
 * @param {import('$roleTypes').RoleFilter?} [filter]
 * @returns {Promise<import('$roleTypes').RoleModel[]>}
 */
export async function getRoles(filter = null) {
    const response = await axios.post(endpoints.rolesUrl, filter);
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


/**
 * Update role
 * @param {import('$roleTypes').RoleModel} model
 * @returns {Promise<boolean>}
 */
export async function updateRole(model) {
    const response = await axios.put(endpoints.roleUpdateUrl, { ...model });
    return response.data;
}