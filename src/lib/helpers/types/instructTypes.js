/**
 * @typedef {Object} InstructMessageModel
 * @property {string} text - The user message.
 * @property {string} [instruction] - User provided prompt instead of predefined template.
 * @property {string?} [template] - The template name.
 * @property {string?} [provider] - The LLM provider.
 * @property {string?} [model] - The LLM model.
 * @property {import('$conversationTypes').ConversationStateModel[]} [states]
 */

/**
 * @typedef {Object} IncomingInstructRequest
 * @property {string} text
 * @property {string} [agentId]
 * @property {string} [instruction]
 * @property {string} [provider]
 * @property {string} [model]
 * @property {string?} [template]
 * @property {import('$conversationTypes').ConversationStateModel[]} [states]
 */

/**
 * @typedef {Object} InstructLogFilter
 * @property {number} page - The page number
 * @property {number} size - The page size
 * @property {string[]?} [agentIds]
 * @property {string[]?} [providers]
 * @property {string[]?} [models]
 * @property {string[]?} [templateNames]
 * @property {string?} [startTime]
 * @property {string?} [endTime]
 * @property {{key: string, value: string}[]?} [states]
 */

/**
 * @typedef {Object} InstructionLogModel
 * @property {string} [id]
 * @property {string?} [agent_id]
 * @property {string?} [agent_name]
 * @property {string} provider
 * @property {string} model
 * @property {string?} [template_name]
 * @property {string?} [user_name]
 * @property {string} user_message
 * @property {string?} [system_instruction]
 * @property {string} completion_text
 * @property {Object?} [states]
 * @property {Date} created_time
 */

/**
 * @typedef {Object} StateSearchQuery
 * @property {string} query - The search query.
 * @property {number?} [keyLimit] - The key limit.
 * @property {number?} [logLimit] - The log limit.
 * @property {boolean?} [preload] - Whether it is preloading or not.
 * @property {string[]?} [agentIds]
 * @property {string?} [startTime]
 * @property {string?} [endTime]
 */

export default {};