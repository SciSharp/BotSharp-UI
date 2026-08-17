/**
 * @typedef {Object} AgentTestSuite
 * @property {string} id
 * @property {string} agentId
 * @property {string} name
 * @property {string?} description
 * @property {boolean} enabled
 * @property {string?} judgeProvider - llmJudge 断言用的 provider。P1 中 llmJudge 恒定判失败，与是否配置无关。
 * @property {string?} judgeModel
 * @property {string[]} extraAllowedFunctions - 在默认控制流白名单之外额外放行的函数名。
 * @property {string[]} forceBlockedFunctions - 强制阻断的函数名，优先级高于白名单。
 * @property {number} caseTimeoutSeconds
 * @property {string} createDate - ISO date string.
 * @property {string} updateDate - ISO date string.
 */

/**
 * POST /agent-test/suites 与 PUT /agent-test/suites/{id} 的请求体。
 *
 * **PUT 是整份替换，不是 PATCH。** 提交前必须先 GET 出完整 suite，只改用户动过的字段，
 * 其余原样带回去 —— agentId/name 漏传时后端会兜底保留原值，但 caseTimeoutSeconds/
 * extraAllowedFunctions/forceBlockedFunctions 漏传会被后端重置为默认值（120 / [] / []）。
 *
 * @typedef {Object} AgentTestSuiteUpsertRequest
 * @property {string} agentId
 * @property {string} name
 * @property {string?} [description]
 * @property {boolean?} [enabled] - 省略或 null = 保持不变（新建时视为 true）；显式传 true/false 才会改变启用状态。
 * @property {string?} [judgeProvider]
 * @property {string?} [judgeModel]
 * @property {string[]} extraAllowedFunctions
 * @property {string[]} forceBlockedFunctions
 * @property {number} caseTimeoutSeconds - 默认 120。
 */

/**
 * @typedef {Object} TestTurn
 * @property {number} index
 * @property {string} userMessage
 * @property {TestAssertion[]} assertions - 本轮级断言（区别于用例整案级的 AgentTestCase.assertions）。
 */

/**
 * @typedef {Object} TestState
 * @property {string} key
 * @property {string} value
 * @property {number} [activeRounds] - 默认 -1（永久有效）。
 * @property {boolean} [global]
 */

/**
 * @typedef {Object} TestToolMock
 * @property {string} functionName
 * @property {string?} [argsMatchJson] - 可选：入参子集匹配（JSON 字符串），用于同名工具多次调用给不同返回。
 * @property {number?} [callIndex] - 可选：只命中第 N 次调用（0 基）。
 * @property {string} [resultContent] - 假返回，写入 message.Content，通常是 JSON 文本。
 * @property {boolean} [stopCompletion] - 模拟"中止本轮 LLM 续写"的真实行为。
 * @property {TestState[]?} [stateWrites] - mock 命中时一并写入的 state；很多 IFunctionCallback 完全靠 state 跨轮传数据，只 mock 返回值会让后续函数读不到 state。
 */

/**
 * 一条断言。
 *
 * 后端保存时校验的必填字段（不满足会 400，但错误信息不指明是哪一条 —— 表单应在提交前自行挡住）：
 * - outputContains / outputNotContains / outputRegex / routedToAgent / llmJudge：`expected` 必填。
 * - toolCalled / toolNotCalled / stateEquals：`target` 必填。
 *
 * 注意一个后端校验没覆盖、但求值时会咬人的点：`stateEquals` 后端保存时只强制 `target`，
 * `expected` 留空并不会 400 —— 但求值时会拿 state 的实际值去比较 null/空串，稳定判不过
 * （不是报错，是永远失败）。表单应比后端的 400 校验更严格，把 `stateEquals` 的 `expected`
 * 也当必填处理。
 *
 * `llmJudge` 在 P1 永远判失败（后端返回 `"llmJudge is not available in P1"`），与 minScore
 * 或 suite 是否配置了 judgeProvider/judgeModel 无关；表单可以让用户选它，但要在旁边标注
 * "P1 不可用，会判失败"。
 *
 * @typedef {Object} TestAssertion
 * @property {string} type - outputContains | outputNotContains | outputRegex | toolCalled | toolNotCalled | stateEquals | routedToAgent | llmJudge
 * @property {string?} [target] - 函数名 / state key / agent 名。
 * @property {string?} [expected] - 期望值 / 正则 / 判官标准。
 * @property {string?} [argsMatchJson] - toolCalled 的入参子集匹配（JSON 字符串）。
 * @property {number?} [minScore] - llmJudge 通过阈值。
 * @property {boolean} [fatal] - 失败则中止该用例后续轮。
 */

/**
 * @typedef {Object} AgentTestCase
 * @property {string} id
 * @property {string} suiteId
 * @property {string} name
 * @property {boolean} enabled - 录制生成的草稿用例落库为 false，需人工审阅后手动启用才会加入正式跑批。
 * @property {TestTurn[]} turns - 长度 1 即单轮用例。
 * @property {TestAssertion[]} assertions - 整案级断言：全部轮跑完后求值。
 * @property {TestState[]} initialStates - 会话开始前注入，映射 BotSharp 的 MessageState。
 * @property {TestToolMock[]} mocks
 * @property {string} unmockedToolPolicy - P1 只接受 "Block"；提交 "Passthrough" 会 400（"Passthrough is not supported in P1"）。表单不要提供这个选项。
 * @property {string?} sourceConversationId - 录制来源会话，便于回溯；手写用例为 null。
 * @property {string} createDate - ISO date string.
 * @property {string} updateDate - ISO date string.
 */

/**
 * POST /agent-test/cases 与 PUT /agent-test/cases/{id} 的请求体。
 *
 * **PUT 是整份替换，不是 PATCH。** 提交前必须先 GET 出完整 case，只改用户动过的部分，
 * 其余字段（尤其是编辑器未必给控件的 `initialStates`、`unmockedToolPolicy`、
 * `sourceConversationId`）原样带回去 —— 任何字段在 UI 上没有对应控件也必须原样带回，
 * 否则保存一次就把它清空了。`suiteId` 漏传时后端会兜底保留原值（除非目标 suite 真的存在
 * 且不同才会重新校验）。
 *
 * @typedef {Object} AgentTestCaseUpsertRequest
 * @property {string} suiteId
 * @property {string} name
 * @property {boolean} [enabled] - 默认 true。
 * @property {TestTurn[]} turns
 * @property {TestAssertion[]} assertions
 * @property {TestState[]} initialStates
 * @property {TestToolMock[]} mocks
 * @property {string} [unmockedToolPolicy] - 固定传 "Block"；默认值本身就是 "Block"。
 * @property {string?} [sourceConversationId]
 */

/**
 * @typedef {Object} AgentTestRun
 * @property {string} id
 * @property {string} suiteId
 * @property {string} status - Pending | Running | Passed | Failed | Error | Cancelled。
 *   `Failed` = 跑了但断言没过；`Error` = 没跑成（超时、canary 失败、用例没有 turns、caseIds
 *   匹配不到任何用例）。UI 必须把这两者显示成不同的东西 —— 混在一起会让"平台坏了"看起来
 *   像"agent 回归了"。
 * @property {string?} triggeredBy - 触发者的用户 id。
 * @property {string[]?} caseIds - 本次运行只跑这些 case；null/空 = 跑 suite 下全部启用的 case。
 * @property {number} totalCount
 * @property {number} passedCount
 * @property {number} failedCount
 * @property {number} errorCount
 * @property {boolean} cancelRequested
 * @property {string?} startedAt - ISO date string；未开始为 null。
 * @property {string?} completedAt - ISO date string；未结束为 null。
 * @property {string} createDate - ISO date string。注意 AgentTestRun 没有 updateDate 字段。
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
 * @property {string} outcome - Mocked | Blocked。`Blocked` 要显眼 —— 意味着 agent 试图调用一个
 *   用例没有 mock 的工具，通常正是失败的根因。
 * @property {string?} resultContent
 */

/**
 * @typedef {Object} AgentTestCaseResult
 * @property {string} id
 * @property {string} runId
 * @property {string} caseId
 * @property {string} caseName
 * @property {string} status - Passed | Failed | Error | Cancelled（不会是 Pending/Running）。
 * @property {string?} conversationId - 本次执行新建的会话 id，不复用线上会话。
 * @property {number} durationMs
 * @property {string?} error - 基础设施层面的失败原因（超时、canary 未生效、用例没有 turns 等），
 *   与断言失败区分开；`status` 为 `Error` 时应把这段文本显示出来。
 * @property {TurnResult[]} turns
 * @property {AssertionResult[]} assertions - 整案级断言结果。
 * @property {ObservedToolCall[]} observedToolCalls
 * @property {string} createDate - ISO date string.
 */

/**
 * GET /agent-test/runs/{id} 的响应体（后端 AgentTestRunDetailDto 的 camelCase 投影）。
 * @typedef {Object} AgentTestRunDetail
 * @property {AgentTestRun} run
 * @property {AgentTestCaseResult[]} results
 */

export default {};
