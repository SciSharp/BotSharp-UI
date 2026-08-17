import { endpoints } from '$lib/services/api-endpoints.js';
import axios from 'axios';

/**
 * Get agent test suites, optionally filtered by agent
 * @param {string?} [agentId]
 * @returns {Promise<import('$agentTestTypes').AgentTestSuite[]>}
 */
export async function getSuites(agentId = null) {
    const url = endpoints.agentTestSuiteListUrl;
    const response = await axios.get(url, {
        params: { agentId: agentId }
    });
    return response.data;
}

/**
 * Get one agent test suite
 * @param {string} id
 * @returns {Promise<import('$agentTestTypes').AgentTestSuite>}
 */
export async function getSuite(id) {
    const url = endpoints.agentTestSuiteDetailUrl.replace("{id}", id);
    const response = await axios.get(url);
    return response.data;
}

/**
 * Create an agent test suite
 * @param {import('$agentTestTypes').AgentTestSuiteUpsertRequest} body
 * @returns {Promise<import('$agentTestTypes').AgentTestSuite>}
 */
export async function createSuite(body) {
    const url = endpoints.agentTestSuiteListUrl;
    const response = await axios.post(url, body);
    return response.data;
}

/**
 * Replace an agent test suite. This is a FULL replace, not a patch -- GET the
 * complete suite first, change only what the user touched, and send every
 * field back. caseTimeoutSeconds/extraAllowedFunctions/forceBlockedFunctions
 * are reset to their defaults by the backend if omitted (agentId/name fall
 * back to the existing value instead).
 * @param {string} id
 * @param {import('$agentTestTypes').AgentTestSuiteUpsertRequest} body
 * @returns {Promise<import('$agentTestTypes').AgentTestSuite>}
 */
export async function updateSuite(id, body) {
    const url = endpoints.agentTestSuiteDetailUrl.replace("{id}", id);
    const response = await axios.put(url, body);
    return response.data;
}

/**
 * Delete an agent test suite
 * @param {string} id
 */
export async function deleteSuite(id) {
    const url = endpoints.agentTestSuiteDetailUrl.replace("{id}", id);
    await axios.delete(url);
}

/**
 * Get the test cases in a suite (newest first)
 * @param {string} suiteId
 * @returns {Promise<import('$agentTestTypes').AgentTestCase[]>}
 */
export async function getCases(suiteId) {
    const url = endpoints.agentTestCaseListUrl;
    const response = await axios.get(url, {
        params: { suiteId: suiteId }
    });
    return response.data;
}

/**
 * Get one test case
 * @param {string} id
 * @returns {Promise<import('$agentTestTypes').AgentTestCase>}
 */
export async function getCase(id) {
    const url = endpoints.agentTestCaseDetailUrl.replace("{id}", id);
    const response = await axios.get(url);
    return response.data;
}

/**
 * Create a test case
 * @param {import('$agentTestTypes').AgentTestCaseUpsertRequest} body
 * @returns {Promise<import('$agentTestTypes').AgentTestCase>}
 */
export async function createCase(body) {
    const url = endpoints.agentTestCaseListUrl;
    const response = await axios.post(url, body);
    return response.data;
}

/**
 * Replace a test case. This is a FULL replace, not a patch -- GET the complete
 * case first, change only what the user touched, and send every field back.
 * Any field with no editor control (e.g. initialStates/sourceConversationId on
 * a recorded case) must still be carried through untouched, or saving once
 * silently clears it.
 * @param {string} id
 * @param {import('$agentTestTypes').AgentTestCaseUpsertRequest} body
 * @returns {Promise<import('$agentTestTypes').AgentTestCase>}
 */
export async function updateCase(id, body) {
    const url = endpoints.agentTestCaseDetailUrl.replace("{id}", id);
    const response = await axios.put(url, body);
    return response.data;
}

/**
 * Delete a test case
 * @param {string} id
 */
export async function deleteCase(id) {
    const url = endpoints.agentTestCaseDetailUrl.replace("{id}", id);
    await axios.delete(url);
}

/**
 * Trigger a run of a suite. This is fire-and-forget: the run is created
 * Pending and queued, and this resolves immediately with the run row -- it
 * does not wait for the run to finish.
 * @param {string} suiteId
 * @param {string[]?} [caseIds] - Only run these cases; omit/empty to run every enabled case in the suite.
 * @returns {Promise<import('$agentTestTypes').AgentTestRun>}
 */
export async function triggerRun(suiteId, caseIds = null) {
    const url = endpoints.agentTestSuiteRunUrl.replace("{id}", suiteId);
    const response = await axios.post(url, { caseIds: caseIds });
    return response.data;
}

/**
 * Get the run history for a suite
 * @param {string} suiteId
 * @returns {Promise<import('$agentTestTypes').AgentTestRun[]>}
 */
export async function getRuns(suiteId) {
    const url = endpoints.agentTestRunListUrl;
    const response = await axios.get(url, {
        params: { suiteId: suiteId }
    });
    return response.data;
}

/**
 * Get a run together with every one of its case results
 * @param {string} id
 * @returns {Promise<import('$agentTestTypes').AgentTestRunDetail>}
 */
export async function getRun(id) {
    const url = endpoints.agentTestRunDetailUrl.replace("{id}", id);
    const response = await axios.get(url);
    return response.data;
}

/**
 * Cancel a pending or running run. The backend returns 409 if the run has
 * already reached a terminal status (Passed/Failed/Error/Cancelled).
 * @param {string} id
 */
export async function cancelRun(id) {
    const url = endpoints.agentTestRunCancelUrl.replace("{id}", id);
    await axios.post(url);
}

/**
 * Record a draft test case from a real conversation. The returned case comes
 * back with enabled=false -- it must be reviewed and explicitly enabled
 * before it joins a normal run.
 * @param {string} conversationId
 * @param {string} suiteId
 * @returns {Promise<import('$agentTestTypes').AgentTestCase>}
 */
export async function recordCase(conversationId, suiteId) {
    const url = endpoints.agentTestRecordUrl;
    const response = await axios.post(url, {
        conversationId: conversationId,
        suiteId: suiteId
    });
    return response.data;
}

/**
 * Get the mock-target candidates (function names) for an agent's mock editor
 * @param {string} agentId
 * @returns {Promise<string[]>}
 */
export async function getMockTargets(agentId) {
    const url = endpoints.agentTestMockTargetsUrl;
    const response = await axios.get(url, {
        params: { agentId: agentId }
    });
    return response.data;
}
