/**
 * @typedef {Object} SimpleClawError
 * @property {'notInstalled'|'notRunning'|'unauthorized'|'forbidden'|'ambiguousAgent'|'notFound'|'http'|'notDesktop'} kind
 * @property {string} message
 */

/**
 * @typedef {Object} SimpleClawStatus
 * @property {boolean} connected
 * @property {string} [version]
 * @property {string} [organization]
 * @property {boolean} busy
 * @property {string} [activeRunId]
 * @property {number} queued
 * @property {SimpleClawError} [error]
 */

/**
 * One operation an agent has been DEMONSTRATED doing.
 * @typedef {Object} SimpleClawOperation
 * @property {string} operation
 * @property {string} sessionId
 * @property {number} demonstratedAt
 */

/**
 * `system` (the sealed start URL) and `operations` are facts and are what routing
 * should key on. `persona` is prose written for the planner — it goes stale, the other
 * two do not.
 * @typedef {Object} SimpleClawAgent
 * @property {string} id
 * @property {string} name
 * @property {string} [iconUrl] Inline data: URL, or absent on an older SimpleClaw.
 * @property {string?} system
 * @property {'desktop'|'window'|'browser'} scopeMode
 * @property {boolean} persistProfile
 * @property {string} persona
 * @property {SimpleClawOperation[]} operations
 */

/**
 * @typedef {Object} SimpleClawCapabilities
 * @property {string} organization
 * @property {SimpleClawAgent[]} agents
 */

/**
 * @typedef {Object} StartRunRequest
 * @property {string} goal
 * @property {string} [agentId]
 * @property {string} [expect]
 * @property {string[]} [outline]
 */

/**
 * @typedef {Object} StartRunResponse
 * @property {string} runId
 * @property {string} agentId
 * @property {{confidence: number, reason: string}} [routing]
 * @property {string} state
 * @property {number} queuePosition
 */

/**
 * @typedef {Object} RunTodo
 * @property {string} text
 * @property {string} status
 * @property {boolean} demoBacked
 * @property {string} [sourceSessionId]
 */

/**
 * @typedef {Object} RunResult
 * @property {'finished'|'stopped'|'error'} status
 * @property {string} answer
 * @property {string} sessionId
 * @property {number} steps
 * @property {RunTodo[]} todos
 * @property {number?} demoCoverage Fraction of plan items a demonstration informed.
 *   A low value on a FAILED run means the operation was never taught — the fix is to
 *   record a demo, not to retry.
 */

/**
 * @typedef {Object} RunView
 * @property {string} runId
 * @property {string} agentId
 * @property {string} goal
 * @property {'queued'|'running'|'done'} state
 * @property {string} status
 * @property {'ask'|'takeover'|string} [pauseReason]
 * @property {string} [askMessage]
 * @property {boolean} takeover
 * @property {number} step
 * @property {number} queuePosition
 * @property {string} [sessionId]
 * @property {RunResult} [result]
 * @property {string} [error]
 */

/**
 * Declares a value a later step references as {{name}}. `pattern` is run against the
 * step's reported answer and the first match becomes the value.
 * @typedef {Object} PlanCapture
 * @property {string} name
 * @property {string} [pattern]
 */

/**
 * @typedef {Object} PlanStep
 * @property {string} agentId
 * @property {string} goal
 * @property {string} [expect]
 * @property {PlanCapture} [capture]
 */

/**
 * `autoRun` is decided by the backend, which requires both that the copilot understood
 * the request and that the plan only reads. The client obeys it rather than re-deriving
 * it, so the rule cannot drift between the two sides.
 *
 * @typedef {Object} Plan
 * @property {string} reply
 * @property {PlanStep[]} steps
 * @property {boolean} [autoRun]
 * @property {'high'|'low'} [confidence]
 * @property {boolean} [readOnly]
 */

export default {};
