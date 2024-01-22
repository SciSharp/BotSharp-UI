import { userStore, getUserStore } from '$lib/helpers/store.js';
import { endpoints } from './api-endpoints.js';
import axios from 'axios';

/**
 * @param {string} email
 * @param {string} password
 * @param {function} onSucceed()
 */
export async function getToken(email, password, onSucceed) {
    const credentials = btoa(`${email}:${password}`);
    const headers = {
        Authorization: `Basic ${credentials}`,
    };

    await fetch(endpoints.tokenUrl, {
        method: 'POST',
        headers: headers,
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            alert(response.statusText);
        }
    }).then(result => {
        let user = getUserStore();
        user.token = result.access_token;
        userStore.set(user);
        onSucceed();
    })
    .catch(error => alert(error.message));
}

/**
 * Set token from exteranl
 * @param {string} token
 */
export function setToken(token) {
    let user = getUserStore();
    user.token = token;
}

/**
 * @returns {Promise<import('$types').UserModel>}
 */
export async function myInfo() {
    const response = await axios.get(endpoints.myInfoUrl);
    let user = getUserStore();
    user.id = response.data.id;
    user.full_name = response.data.full_name;
    userStore.set(user);
    return response.data;
}

/**
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} email
 * @param {string} password
 * @param {function} onSucceed()
 */
export async function register(firstName, lastName, email, password, onSucceed) {
    let data = JSON.stringify({
        firstName,
        lastName,
        email,
        password
    });

    await fetch(endpoints.usrCreationUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: data
    })
    .then(result => {
        if (result.ok) {
            onSucceed();
        } else {
            alert(result.statusText);
        }
    })
    .catch(error => alert(error.message));
}