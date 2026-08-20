/**
 * @typedef {Object} AgentTestSuite
 * @property {string} id
 * @property {string} agentId
 * @property {string} name
 * @property {string?} description
 * @property {boolean} enabled
 * @property {string?} judgeProvider - Provider for llmJudge assertions. Both this and judgeModel are
 *   required for llmJudge to be scored at all; with either missing, an llmJudge assertion records a
 *   case-level Error rather than being scored with some default model.
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
 * `llmJudge` is scored 1-5 by the suite's judge model, and `minScore` is the pass mark (default 4).
 * It is the one assertion type that is not reproducible, and the one that can end a case in Error
 * rather than Failed: an unconfigured judge model, an unregistered provider, a vendor failure or a
 * reply the backend cannot read as a score all mean "no verdict", which is Error. Those are
 * deliberately not failures -- a vendor timeout is not an agent regression. Note also that the judge
 * only ever sees the criterion and the agent's reply, never the user's message, so a criterion has
 * to be self-contained.
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
 * @property {string} caseType - Routing | Agent. Defaults to Agent, which is also what every case
 *   stored before the field existed reads back as. Routing is validated more strictly (one turn,
 *   must assert a routing outcome, no llmJudge) and is the only type counted towards a run's routing
 *   accuracy. A journey across several agents is an Agent case whose `agentChain` assertion
 *   describes the hand-offs.
 * @property {string?} entryAgentId - Agent the conversation opens on, overriding the suite's; null
 *   uses the suite's. This is the switch between testing routing and testing one agent alone:
 *   BotSharp sends a routing-type agent through the router (which can hand off) and any other agent
 *   straight into itself (the router never runs).
 * @property {TestTurn[]} turns - Length 1 is a single-turn case.
 * @property {TestAssertion[]} assertions - Case-level assertions, evaluated after every turn has run.
 * @property {TestState[]} initialStates - Injected before the conversation starts; maps to BotSharp's
 *   MessageState.
 * @property {TestHistoryMessage[]} history - Prior turns written into the conversation before the
 *   case's own turns run, so a real question-and-answer exchange becomes the fixed starting context.
 *   Not driven through the model (no token cost, no flakiness) and never counted in `agentChain`.
 * @property {TestToolMock[]} mocks
 * @property {string} unmockedToolPolicy - P1 accepts only "Block"; sending "Passthrough" is a 400
 *   ("Passthrough is not supported in P1"). The form should not offer it.
 * @property {string?} sourceConversationId - The conversation this was recorded from, for
 *   traceability; null for a hand-written case.
 * @property {string} priority - P0 | P1 | P2. Decides the batch, and therefore whether a failure
 *   stops the evaluation. Defaults to P1, which is also what a case stored before the field existed
 *   reads back as.
 * @property {string} severity - S0 | S1 | S2. What a failure MEANS, as opposed to how urgent the case
 *   is to run. Defaults to S1.
 * @property {number?} batch - Explicit override; null derives it from priority and crossCutting.
 * @property {boolean} crossCutting - Runs in every scope whatever changed, and always in batch 1.
 * @property {string[]} involvedAgents - Agent ids. Empty falls back to the case's entry agent, which
 *   is right for an Agent case and only a starting point for a Routing case, where the agents that
 *   matter are downstream of the router.
 * @property {string?} businessDomain
 * @property {string?} expectedOutcome - For whoever reviews the result; never evaluated.
 * @property {string?} lastReviewedDate - ISO date. Never set by the server: editing a case is not
 *   reviewing it.
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
 * @property {string} [caseType] - Routing | Agent; blank or omitted means Agent. Any other value is
 *   a 400 rather than a silent fallback.
 * @property {string?} [entryAgentId] - Send null rather than "" to mean "use the suite's agent";
 *   validated to exist at save time.
 * @property {TestHistoryMessage[]} [history] - Authored prior turns; every message needs a
 *   user/assistant role and non-empty content.
 * @property {string} [priority] - P0 | P1 | P2; blank keeps P1. Any other value is a 400.
 * @property {string} [severity] - S0 | S1 | S2; blank keeps S1.
 * @property {number?} [batch] - 1, 2 or 3; null derives it. Out of range is a 400, not a clamp.
 * @property {boolean} [crossCutting]
 * @property {string[]} [involvedAgents]
 * @property {string?} [businessDomain]
 * @property {string?} [expectedOutcome]
 * @property {string?} [lastReviewedDate] - ISO date; send it only when a human actually reviewed.
 * @property {TestTurn[]} turns
 * @property {TestAssertion[]} assertions
 * @property {TestState[]} initialStates
 * @property {TestToolMock[]} mocks
 * @property {string} [unmockedToolPolicy] - Always send "Block"; that is also the default.
 * @property {string?} [sourceConversationId]
 */

/**
 * One authored message in a case's history. Just a role and text: a mocked tool call belongs in
 * `mocks`, and a fabricated function-call dialog would let a case claim a tool ran when nothing did.
 * @typedef {Object} TestHistoryMessage
 * @property {string} role - user | assistant. Nothing else: `system` would compete with the agent's
 *   own instruction and `function` would fake a tool call.
 * @property {string} content - Rejected as empty; BotSharp's dialog storage drops blank elements, so
 *   an empty message would silently not be in the conversation at run time.
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
 * @property {RoutingAccuracy[]} routingAccuracies - One row per model swept, counting only Routing
 *   cases; empty when the run contained none.
 * @property {PerformanceSummary[]} performanceSummaries - Latency, token and cost figures, one row per
 *   model. Computed when the run finishes, because a percentile needs every value at once.
 * @property {ModelPricingSnapshot[]} modelPricing - The unit costs in force when the run executed. A
 *   cost figure is not comparable with another run's unless these match. Kept per model because a single run-wide figure would
 *   average a candidate model together with the baseline and hide the difference the run exists to
 *   measure.
 * @property {boolean} cancelRequested
 * @property {string?} startedAt - ISO date string; null until it starts.
 * @property {string?} completedAt - ISO date string; null until it finishes.
 * @property {string} createDate - ISO date string. Note AgentTestRun has no updateDate field.
 */

/**
 * Latency, tokens and cost for one model within a run. Averages are absent on purpose: an average is
 * Total/CaseCount, and a stored copy is one more thing that can disagree with the rows it came from.
 * @typedef {Object} PerformanceSummary
 * @property {string?} provider
 * @property {string?} model
 * @property {number} caseCount - Only the cases that reached the model. A case that failed before its
 *   first turn would drag a latency percentile towards zero and make a broken run look fast.
 * @property {number} latencyP50Ms - Nearest-rank median of the agent-call time, so it is always a
 *   duration some case actually took rather than an interpolated one that none did.
 * @property {number} latencyP95Ms
 * @property {number} totalTokens - Over EVERY result, unlike latency: a case that errored still spent
 *   what it spent.
 * @property {number} totalCost
 */

/**
 * One model's configured text-token unit costs at the moment a run executed.
 * @typedef {Object} ModelPricingSnapshot
 * @property {string?} provider
 * @property {string?} model
 * @property {number?} textInputCost - Null means the settings could not be read. Never render it as
 *   0, which would read as "this model is free".
 * @property {number?} textOutputCost
 */

/**
 * Routing accuracy for one model within a run. Counts, never a stored percentage: "3/4" says how
 * much the figure is worth trusting and "75%" does not.
 * @typedef {Object} RoutingAccuracy
 * @property {string?} provider - Null for both when the run swept no models.
 * @property {string?} model
 * @property {number} caseCount - Routing cases executed under this model, whatever their outcome --
 *   Error rows included, because "could not tell" is not "routed correctly".
 * @property {number} passedCount
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
 * @property {number} modelDurationMs - Time the agent call for this turn took, excluding the
 *   assertion evaluation and conversation reads that follow it.
 * @property {string[]} agentChain - The agents that answered during THIS turn, in order, with
 *   consecutive repeats collapsed. Not derivable from the case-level chain, which collapses across
 *   turn boundaries too.
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
 * @property {string} caseType - Copied off the case so a result is self-describing; routing
 *   accuracy is aggregated from these rows rather than from cases that may since have been edited.
 * @property {string} status - Passed | Failed | Error | Cancelled (never Pending/Running).
 * @property {string?} conversationId - The conversation this execution created; live conversations
 *   are never reused.
 * @property {string?} provider - Which model produced this result; null = the agent's own
 *   LlmConfig was used.
 * @property {string?} model - As above. In a multi-model run the same `caseId` yields several
 *   results, told apart by these two fields.
 * @property {number} durationMs - Wall clock for the whole case, including the canary and the
 *   conversation reads. Comparable between models, but not a model-latency measurement.
 * @property {number} modelDurationMs - The agent calls alone, summed over the turns. This is what the
 *   run's latency percentiles are built from.
 * @property {number} totalTokens - Measured as a delta across this case's own execution. Total only:
 *   the input/output split is not reachable through ITokenStatistics.
 * @property {number} cost
 * @property {string?} error - Infrastructure-level reason for failure (timeout, a dead mock seam, a
 *   case with no turns), as distinct from an assertion failure. Show this text whenever `status` is
 *   `Error`.
 * @property {TurnResult[]} turns
 * @property {AssertionResult[]} assertions - Case-level assertion results.
 * @property {ObservedToolCall[]} observedToolCalls
 * @property {string[]} agentChain - Every agent that answered over the whole case, in order,
 *   consecutive repeats collapsed. The only record of the hand-offs: route_to_agent is allowed
 *   through the mock seam untouched, so it never appears in `observedToolCalls`.
 * @property {string} createDate - ISO date string.
 */

/**
 * One case's place in a scope, carrying the metadata the decision was made from rather than just the
 * verdict -- a scope nobody can explain is a scope nobody can review.
 * @typedef {Object} ScopedCase
 * @property {string} caseId
 * @property {string} caseName
 * @property {string} suiteId
 * @property {string} suiteName
 * @property {string} caseType
 * @property {string} priority
 * @property {string} severity
 * @property {boolean} crossCutting
 * @property {boolean} enabled
 * @property {number} batch - The effective batch, after the priority and cross-cutting derivation.
 * @property {string[]} involvedAgentIds - Authored, or derived from the entry agent.
 * @property {string} reason - crossCutting | fullPlatform | targetAgent | unknownAgents |
 *   notInvolved | disabled | otherBatch.
 */

/**
 * The answer to "what will this change actually test". Both halves are returned on purpose: an
 * excluded case produces no result to notice, so the exclusions and their reasons are the half worth
 * reading.
 * @typedef {Object} ScopeSelection
 * @property {string[]} targetAgentIds
 * @property {boolean} fullPlatform
 * @property {number?} batch
 * @property {number} totalCases - Every registered case, whatever its state: the coverage denominator.
 * @property {ScopedCase[]} included
 * @property {ScopedCase[]} excluded
 */

/**
 * Body of GET /agent-test/runs/{id} (the camelCase projection of the backend's
 * AgentTestRunDetailDto).
 * @typedef {Object} AgentTestRunDetail
 * @property {AgentTestRun} run
 * @property {AgentTestCaseResult[]} results
 */

export default {};
