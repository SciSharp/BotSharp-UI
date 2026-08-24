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
	'agentChain',
	'llmJudge'
];

/** Types whose `expected` the backend rejects as empty. */
const EXPECTED_REQUIRED = [
	'outputContains',
	'outputNotContains',
	'outputRegex',
	'routedToAgent',
	'agentChain',
	'llmJudge'
];

/** Types whose `target` the backend rejects as empty. */
const TARGET_REQUIRED = ['toolCalled', 'toolNotCalled', 'stateEquals'];

/**
 * How an `agentChain` assertion compares its expected list (AgentChainModes in
 * AssertionEvaluator.cs). On this assertion type `target` carries the mode
 * rather than a function name or state key.
 */
export const AGENT_CHAIN_MODES = ['contains', 'ordered', 'exact'];

/**
 * What a case is verifying (CaseTypes in AgentTestCase.cs). Routing is checked
 * more strictly -- see `validateCaseType` -- because it is the only type counted
 * towards a run's routing accuracy. A multi-agent journey is an Agent case whose
 * `agentChain` assertion describes the hand-offs.
 */
export const CASE_TYPES = ['Routing', 'Agent'];

/**
 * Roles an authored history message may take (HistoryRoles in AgentTestCase.cs).
 * Only these two: `system` would compete with the agent's own instruction and
 * `function` would fake a tool call, letting a case claim a tool ran when
 * nothing did.
 */
export const HISTORY_ROLES = ['user', 'assistant'];

/**
 * How urgent it is to run a case, which is what decides its batch (CasePriorities
 * in AgentTestCase.cs). Distinct from severity: priority is scheduling,
 * severity is consequence.
 */
export const CASE_PRIORITIES = ['P0', 'P1', 'P2'];

/**
 * What a failure means (CaseSeverities in AgentTestCase.cs). S0 is a stop rather
 * than a statistic; S2 must never be able to mask an S0 or S1.
 */
export const CASE_SEVERITIES = ['S0', 'S1', 'S2'];

/** Batches run in order: 1 is the stop-loss batch, 3 does not block a release. */
export const CASE_BATCHES = [1, 2, 3];

/**
 * Tone for a priority badge. P0 is the stop-loss batch -- one failure there halts the
 * whole evaluation -- so it reads as urgent; P2 does not block a release and reads as
 * quiet. The middle stays neutral rather than warning-coloured, because P1 is the
 * default every untriaged case carries and a wall of amber would say nothing.
 * @param {string?} priority
 */
export function priorityTone(priority) {
	switch (priority) {
		case 'P0': return 'danger';
		case 'P2': return 'secondary';
		default: return 'primary';
	}
}

/**
 * Tone for a severity badge. S0 is zero-tolerance -- data leakage, an unauthorised
 * action, a missed escalation -- and has to be visible at a glance in a list, which is
 * the whole reason severity is worth a column. S2 is phrasing and must never look as
 * loud as the other two.
 * @param {string?} severity
 */
export function severityTone(severity) {
	switch (severity) {
		case 'S0': return 'danger';
		case 'S1': return 'warning';
		default: return 'secondary';
	}
}

/**
 * The batch a case will actually run in, mirroring CaseBatches.Effective. An
 * explicit batch wins; a cross-cutting case is batch 1 whatever its priority,
 * because a safety case that only runs after everything else has passed cannot
 * stop anything.
 * @param {{ batch?: number | null, crossCutting?: boolean, priority?: string }} testCase
 * @returns {number}
 */
export function effectiveBatch(testCase) {
	if (CASE_BATCHES.includes(Number(testCase?.batch))) {
		return Number(testCase.batch);
	}
	if (testCase?.crossCutting) {
		return 1;
	}
	if (testCase?.priority === 'P0') return 1;
	if (testCase?.priority === 'P2') return 3;
	return 2;
}

/** Assertion types that establish a routing outcome, so a Routing case needs one. */
const ROUTING_ASSERTION_TYPES = ['routedToAgent', 'agentChain'];

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

	// agentChain puts the comparison mode in `target`. An unrecognised value fails
	// at evaluation time rather than falling back to the loosest mode, so catching
	// it here just moves that failure to where the author can see it. Blank is
	// legal and means `contains`.
	if (type === 'agentChain' && assertion.target?.trim()
		&& !AGENT_CHAIN_MODES.includes(assertion.target.trim().toLowerCase())) {
		return t('Assertion "agentChain" mode must be one of {modes}.', { modes: AGENT_CHAIN_MODES.join(', ') });
	}

	if (assertion.argsMatchJson?.trim() && !isParsableJson(assertion.argsMatchJson)) {
		return t('The args match on an assertion is not valid JSON.');
	}

	return null;
}

/**
 * The extra rules the backend applies to a Routing case, checked here so the
 * author sees them while editing instead of as a 400 on save. Kept in step with
 * AgentTestController.ValidateRoutingCase -- if these two ever disagree, the
 * backend wins and the save fails, which is the safe direction.
 * @param {string} caseType
 * @param {import('$agentTestTypes').TestTurn[]} turns
 * @param {import('$agentTestTypes').TestAssertion[]} caseAssertions
 * @returns {string[]} one message per problem, empty when the case is acceptable
 */
export function validateCaseType(caseType, turns, caseAssertions) {
	if (caseType !== 'Routing') {
		return [];
	}

	const problems = [];
	const all = [...(turns || []).flatMap(turn => turn.assertions || []), ...(caseAssertions || [])];

	// Routing asks a single-turn question: which agent picks this message up. A
	// second turn asks something else, and its verdict would still land in the
	// routing accuracy figure.
	// Authored history is deliberately not counted: replaying a prior exchange and
	// then asking one question is still a single routing decision, and it is the most
	// realistic way to test routing that depends on context.
	if ((turns || []).length !== 1) {
		problems.push(t('A Routing case must have exactly one turn. Use an Agent case for a multi-turn case.'));
	}

	// Without one of these the case asserts nothing about routing yet still counts
	// towards routing accuracy -- it reports Passed for having said anything at all.
	if (!all.some(a => ROUTING_ASSERTION_TYPES.includes(a?.type))) {
		problems.push(t('A Routing case needs at least one routedToAgent or agentChain assertion.'));
	}

	// Routing is scored purely as expected agent == actual agent. An llmJudge would
	// also make the figure depend on a vendor call, so a vendor outage would read
	// as a routing regression.
	if (all.some(a => a?.type === 'llmJudge')) {
		problems.push(t('A Routing case cannot use llmJudge: routing is judged only by which agent handled the conversation.'));
	}

	return problems;
}

/**
 * An agent chain rendered the way the backend reports it in an assertion's
 * `actual`, so the two read the same on screen.
 * @param {string[] | null | undefined} chain
 * @returns {string}
 */
export function formatAgentChain(chain) {
	return chain?.length ? chain.join(' -> ') : '--';
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
