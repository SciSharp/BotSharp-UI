import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

/**
 * Shared helpers for the agent test pages. Kept out of the page components
 * because all four of them have to agree on what a status means -- showing
 * `Failed` and `Error` the same way is the one mistake that makes "the harness
 * broke" look like "the agent regressed".
 */

/**
 * Translate from plain JS, where the `$_` auto-subscription is not available.
 * Read at call time, never at module load -- the dictionary is fetched
 * asynchronously by setupI18n and is empty while the module is first evaluated.
 *
 * This is a one-shot read, not a subscription, so the result does not
 * re-translate if the user switches language afterwards. That is fine for what
 * uses it (toasts, confirm dialogs, validation text -- all short-lived or
 * recomputed on the next keystroke). Anything that has to survive a language
 * switch on screen belongs in the markup as `$_(...)` instead.
 * @param {string} id
 * @param {Record<string, any>} [values]
 * @returns {string}
 */
export function t(id, values = undefined) {
	return get(_)(id, values ? { values } : undefined);
}

/** Assertion types the backend can actually evaluate (AssertionTypes in AssertionEvaluator.cs). */
export const ASSERTION_TYPES = [
	'outputContains',
	'outputNotContains',
	'outputRegex',
	'toolCalled',
	'toolNotCalled',
	'stateEquals',
	'routedToAgent',
	'llmJudge'
];

/** Types whose `expected` the backend rejects as empty. */
const EXPECTED_REQUIRED = ['outputContains', 'outputNotContains', 'outputRegex', 'routedToAgent', 'llmJudge'];

/** Types whose `target` the backend rejects as empty. */
const TARGET_REQUIRED = ['toolCalled', 'toolNotCalled', 'stateEquals'];

/**
 * Bootstrap contextual class for a run/case status.
 * @param {string?} status
 * @returns {string}
 */
export function statusColor(status) {
	switch (status) {
		case 'Passed': return 'success';
		// Failed = it ran and an assertion did not hold. Error = it never got to
		// assert (timeout, canary, no turns). Different colours on purpose.
		case 'Failed': return 'danger';
		case 'Error': return 'warning';
		case 'Running': return 'info';
		case 'Pending': return 'secondary';
		case 'Cancelled': return 'dark';
		default: return 'secondary';
	}
}

/**
 * A run in Pending/Running is still moving, so the detail page keeps polling
 * and the cancel button stays live.
 * @param {string?} status
 */
export function isTerminalStatus(status) {
	return status === 'Passed' || status === 'Failed' || status === 'Error' || status === 'Cancelled';
}

/**
 * Pull the backend's own message out of an axios error. These endpoints return
 * genuinely actionable 400s ("Passthrough is not supported in P1", "assertion
 * 'outputRegex' requires a non-empty 'expected' value", "suite is disabled"),
 * so swallowing them behind a generic string throws away the only clue there
 * is. Those messages are server-side English and are shown as-is; only the
 * strings this file owns are translated.
 * @param {any} err
 * @param {string} fallback - already-translated text
 * @returns {string}
 */
export function errorMessage(err, fallback) {
	const data = err?.response?.data;
	if (typeof data === 'string' && data.trim()) {
		return data;
	}
	if (typeof data?.message === 'string' && data.message.trim()) {
		return data.message;
	}
	if (err?.response?.status === 401 || err?.response?.status === 403) {
		return t('You do not have permission for this. Running and recording require an admin or root account.');
	}
	return fallback;
}

/**
 * Validate one assertion the way the backend does, plus the two cases it lets
 * through but that can never pass at evaluation time.
 * @param {import('$agentTestTypes').TestAssertion} assertion
 * @returns {string?} null when well-formed, otherwise a message for the author
 */
export function validateAssertion(assertion) {
	const type = assertion?.type;
	if (!type) {
		return t('Assertion type is required.');
	}

	if (EXPECTED_REQUIRED.includes(type) && !assertion.expected?.trim()) {
		return t('Assertion "{type}" needs an expected value.', { type });
	}

	if (TARGET_REQUIRED.includes(type) && !assertion.target?.trim()) {
		return t('Assertion "{type}" needs a target.', { type });
	}

	// Stricter than the backend on purpose: stateEquals saves fine with an empty
	// `expected`, then compares the real state value against null and fails on
	// every single run. A silent always-red assertion is worse than a save error.
	if (type === 'stateEquals' && !assertion.expected?.trim()) {
		return t('Assertion "stateEquals" needs an expected value, otherwise it can never pass.');
	}

	if (type === 'outputRegex' && assertion.expected?.trim()) {
		try {
			new RegExp(assertion.expected);
		} catch {
			return t('"{pattern}" is not a valid regular expression.', { pattern: assertion.expected });
		}
	}

	if (assertion.argsMatchJson?.trim() && !isParsableJson(assertion.argsMatchJson)) {
		return t('The args match on an assertion is not valid JSON.');
	}

	return null;
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function isParsableJson(text) {
	try {
		JSON.parse(text);
		return true;
	} catch {
		return false;
	}
}

/**
 * @param {number?} ms
 * @returns {string}
 */
export function formatDuration(ms) {
	if (ms == null) return '--';
	if (ms < 1000) return t('{ms} ms', { ms });
	return t('{seconds} s', { seconds: (ms / 1000).toFixed(1) });
}

/**
 * @param {string?} iso
 * @returns {string}
 */
export function formatDateTime(iso) {
	if (!iso) return '--';
	const date = new Date(iso);
	return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString();
}
