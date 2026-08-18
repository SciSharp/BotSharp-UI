/**
 * @typedef {Object} AgentTestSuite
 * @property {string} id
 * @property {string} agentId
 * @property {string} name
 * @property {string?} description
 * @property {boolean} enabled
 * @property {string?} judgeProvider - Provider for llmJudge assertions. In P1 llmJudge always fails,
 *   whether or not this is configured.
 * @property {string?} judgeModel
 * @property {string[]} extraAllowedFunctions - Functions let through on top of the default
 *   control-flow allow list.
 * @property {string[]} forceBlockedFunctions - Functions blocked outright; wins over the allow list.
 * @property {number} caseTimeoutSeconds
 * @property {string} createDate - ISO date string.
 * @property {string} updateDate - ISO date string.
 */

/**
 * Body for POST /agent-test/suites and PUT /agent-test/suites/{id}.
 *
 * **PUT is a full replace, not a PATCH.** GET the complete suite first, change only what the user
 * touched, and send everything else back unchanged -- a missing agentId/name falls back to the
 * stored value, but a missing caseTimeoutSeconds/extraAllowedFunctions/forceBlockedFunctions is
 * reset to the backend default (120 / [] / []).
 *
 * @typedef {Object} AgentTestSuiteUpsertRequest
 * @property {string} agentId
 * @property {string} name
 * @property {string?} [description]
 * @property {boolean?} [enabled] - Omitted or null = leave unchanged (treated as true on create);
 *   only an explicit true/false flips the enabled state.
 * @property {string?} [judgeProvider]
 * @property {string?} [judgeModel]
 * @property {string[]} extraAllowedFunctions
 * @property {string[]} forceBlockedFunctions
 * @property {number} caseTimeoutSeconds - Defaults to 120.
 */

/**
 * @typedef {Object} TestTurn
 * @property {number} index
 * @property {string} userMessage
 * @property {TestAssertion[]} assertions - Turn-level assertions, as opposed to the case-level
 *   AgentTestCase.assertions.
 */

/**
 * @typedef {Object} TestState
 * @property {string} key
 * @property {string} value
 * @property {number} [activeRounds] - Defaults to -1 (never expires).
 * @property {boolean} [global]
 */

/**
 * @typedef {Object} TestToolMock
 * @property {string} functionName
 * @property {string?} [argsMatchJson] - Optional argument-subset match (a JSON string), for giving
 *   different returns to repeated calls of the same tool.
 * @property {number?} [callIndex] - Optional: match only the Nth call (0-based).
 * @property {string} [resultContent] - The faked return, written to message.Content; usually JSON text.
 * @property {boolean} [stopCompletion] - Reproduces a real tool's "stop this turn's LLM completion".
 * @property {TestState[]?} [stateWrites] - State written when this mock is hit. Many
 *   IFunctionCallback implementations pass data across turns purely through state, so mocking only
 *   the return value leaves later functions unable to read what they expect.
 */

/**
 * One assertion.
 *
 * Fields the backend enforces on save (a violation is a 400, but the message does not say which
 * assertion -- the form should block it first):
 * - outputContains / outputNotContains / outputRegex / routedToAgent / llmJudge: `expected` required.
 * - toolCalled / toolNotCalled / stateEquals: `target` required.
 *
 * One trap the backend does NOT cover but evaluation does: `stateEquals` only requires `target` on
 * save, so an empty `expected` saves fine -- and then compares the real state value against
 * null/empty on every run and can never pass. It fails rather than errors, so nothing points at it.
 * The form is deliberately stricter and treats `expected` as required there too.
 *
 * `llmJudge` always fails in P1 (the backend returns "llmJudge is not available in P1"), regardless
 * of minScore or whether the suite configured judgeProvider/judgeModel. The form may offer it, but
 * says so next to it.
 *
 * @typedef {Object} TestAssertion
 * @property {string} type - outputContains | outputNotContains | outputRegex | toolCalled | toolNotCalled | stateEquals | routedToAgent | llmJudge
 * @property {string?} [target] - Function name / state key / agent name.
 * @property {string?} [expected] - Expected value / regex / judging criteria.
 * @property {string?} [argsMatchJson] - Argument-subset match for toolCalled (a JSON string).
 * @property {number?} [minScore] - Pass threshold for llmJudge.
 * @property {boolean} [fatal] - On failure, abort the remaining turns of this case.
 */

/**
 * @typedef {Object} AgentTestCase
 * @property {string} id
 * @property {string} suiteId
 * @property {string} name
 * @property {boolean} enabled - Recorded drafts land as false; a human has to review and enable them
 *   before they join a normal run.
 * @property {TestTurn[]} turns - Length 1 is a single-turn case.
 * @property {TestAssertion[]} assertions - Case-level assertions, evaluated after every turn has run.
 * @property {TestState[]} initialStates - Injected before the conversation starts; maps to BotSharp's
 *   MessageState.
 * @property {TestToolMock[]} mocks
 * @property {string} unmockedToolPolicy - P1 accepts only "Block"; sending "Passthrough" is a 400
 *   ("Passthrough is not supported in P1"). The form should not offer it.
 * @property {string?} sourceConversationId - The conversation this was recorded from, for
 *   traceability; null for a hand-written case.
 * @property {string} createDate - ISO date string.
 * @property {string} updateDate - ISO date string.
 */

/**
 * Body for POST /agent-test/cases and PUT /agent-test/cases/{id}.
 *
 * **PUT is a full replace, not a PATCH.** GET the complete case first, change only what the user
 * touched, and send every other field back unchanged -- especially the ones the editor may not give
 * a control for (`initialStates`, `unmockedToolPolicy`, `sourceConversationId`). Any field without a
 * control still has to travel, or saving once clears it. A missing `suiteId` falls back to the
 * stored value (only a genuinely different, existing suite is re-validated).
 *
 * @typedef {Object} AgentTestCaseUpsertRequest
 * @property {string} suiteId
 * @property {string} name
 * @property {boolean} [enabled] - Defaults to true.
 * @property {TestTurn[]} turns
 * @property {TestAssertion[]} assertions
 * @property {TestState[]} initialStates
 * @property {TestToolMock[]} mocks
 * @property {string} [unmockedToolPolicy] - Always send "Block"; that is also the default.
 * @property {string?} [sourceConversationId]
 */

/**
 * One model to run against.
 * @typedef {Object} TestModel
 * @property {string} provider
 * @property {string} model
 */

/**
 * @typedef {Object} AgentTestRun
 * @property {string} id
 * @property {string} suiteId
 * @property {TestModel[]?} models - Models this run swept; null/empty = a single pass on the
 *   agent's own LlmConfig. When set, the executor runs the cartesian product of cases x models,
 *   so `totalCount` is "cases x models" and does NOT equal the case count -- showing it as a case
 *   count in the UI will not add up.
 * @property {string} status - Pending | Running | Passed | Failed | Error | Cancelled.
 *   `Failed` = it ran and an assertion did not hold. `Error` = it never got that far (timeout,
 *   canary failure, a case with no turns, caseIds matching nothing). The UI must show these as
 *   different things -- collapsing them makes "the harness broke" read as "the agent regressed".
 * @property {string?} error - Why the run ended as `Error`: an infrastructure stop that happened
 *   before or instead of executing cases (suite gone or disabled, the selected cases were all
 *   disabled, the host restarted mid-run, an unhandled crash). Distinct from
 *   AgentTestCaseResult.error, which explains one case -- a run can fail with ZERO case results,
 *   and then this is the only place the reason exists.
 * @property {string?} triggeredBy - User id of whoever triggered it.
 * @property {string[]?} caseIds - Run only these cases; null/empty = every enabled case in the suite.
 * @property {number} totalCount
 * @property {number} passedCount
 * @property {number} failedCount
 * @property {number} errorCount
 * @property {boolean} cancelRequested
 * @property {string?} startedAt - ISO date string; null until it starts.
 * @property {string?} completedAt - ISO date string; null until it finishes.
 * @property {string} createDate - ISO date string. Note AgentTestRun has no updateDate field.
 */

/**
 * @typedef {Object} AssertionResult
 * @property {string} type
 * @property {string?} target
 * @property {string?} expected
 * @property {string?} actual
 * @property {boolean} passed
 * @property {string?} message
 */

/**
 * @typedef {Object} TurnResult
 * @property {number} index
 * @property {string} userMessage
 * @property {string?} output
 * @property {AssertionResult[]} assertions
 */

/**
 * @typedef {Object} ObservedToolCall
 * @property {number} turnIndex
 * @property {string} functionName
 * @property {string?} argsJson
 * @property {string} outcome - Mocked | Blocked. `Blocked` needs to stand out: it means the agent
 *   tried to call a tool this case does not mock, which is usually the root cause of the failure.
 * @property {string?} resultContent
 */

/**
 * @typedef {Object} AgentTestCaseResult
 * @property {string} id
 * @property {string} runId
 * @property {string} caseId
 * @property {string} caseName
 * @property {string} status - Passed | Failed | Error | Cancelled (never Pending/Running).
 * @property {string?} conversationId - The conversation this execution created; live conversations
 *   are never reused.
 * @property {string?} provider - Which model produced this result; null = the agent's own
 *   LlmConfig was used.
 * @property {string?} model - As above. In a multi-model run the same `caseId` yields several
 *   results, told apart by these two fields.
 * @property {number} durationMs
 * @property {string?} error - Infrastructure-level reason for failure (timeout, a dead mock seam, a
 *   case with no turns), as distinct from an assertion failure. Show this text whenever `status` is
 *   `Error`.
 * @property {TurnResult[]} turns
 * @property {AssertionResult[]} assertions - Case-level assertion results.
 * @property {ObservedToolCall[]} observedToolCalls
 * @property {string} createDate - ISO date string.
 */

/**
 * Body of GET /agent-test/runs/{id} (the camelCase projection of the backend's
 * AgentTestRunDetailDto).
 * @typedef {Object} AgentTestRunDetail
 * @property {AgentTestRun} run
 * @property {AgentTestCaseResult[]} results
 */

export default {};
