import { userStore, getUserStore, resetStorage, setTenantId, clearTenantId, getTenantId, clearTenantName, notifyTenantChanged } from '$lib/helpers/store.js';
import { endpoints } from './api-endpoints.js';
import axios from 'axios';

/**
 * @param {string} email
 * @param {string} password
 * @param {string} tenantId
 * @param {function} onSucceed
 * @param {function} onError
 */
export async function getToken(email, password, tenantId, onSucceed, onError) {
    const credentials = btoa(`${email}:${password}`);
    /** @type {Record<string, string>} */
    const headers = {
        Authorization: `Basic ${credentials}`,
    };

    if (tenantId) {
        headers['__tenant'] = tenantId;
    }

    await fetch(endpoints.tokenUrl, {
        method: 'POST',
        headers: headers,
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            console.log(response.statusText);
            onError();
            return false;
        }
    }).then(result => {
        if (!result) {
            return;
        }
        const user = getUserStore();
        user.token = result.access_token;
        user.expires = result.expires;
        user.renew_token_count = 0;
        userStore.set(user);

        if (tenantId) {
            setTenantId(tenantId);
            notifyTenantChanged();
        } else {
            clearTenantId();
            clearTenantName();
        }

        onSucceed();
    })
    .catch(() => {
        onError();
    });
}

/**
 * @param {string} token
 * @param {((arg0: string) => void) | null} [onSucceed]
 * @param {(() => void) | null} [onError]
 */
export async function renewToken(token, onSucceed = null, onError = null) {
    const tenantId = getTenantId();
    await fetch(endpoints.renewTokenUrl, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(tenantId ? { "__tenant": tenantId } : {})
        },
        body: JSON.stringify({ refresh_token: token, access_token: token }),
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            console.log(response.statusText);
            onError?.();
            return false;
        }
    }).then(result => {
        if (!result) {
            return;
        }
        const user = getUserStore();
        user.token = result.access_token;
        user.expires = result.expires;
        userStore.set(user);
        onSucceed?.(result.access_token);
    })
    .catch(() => {
        onError?.();
    });
}

/**
 * Set token from exteranl
 * @param {string} token
 */
export async function setToken(token) {
    let user = getUserStore();
    user.token = token;
    userStore.set(user);
}

/**
 * @returns {Promise<import('$userTypes').UserModel>}
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
 * @param {function} onSucceed
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

/**
 * @param {import('$fileTypes').FileModel} file
 */
export async function uploadUserAvatar(file) {
    const response = await axios.post(endpoints.userAvatarUrl, { ...file });
    return response?.data;
}

export async function getTenantOptions() {
    try {
        const response = await fetch(`${endpoints.userTenantsUrl}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        return result;
    } catch (error) {
        return null;
    }
}