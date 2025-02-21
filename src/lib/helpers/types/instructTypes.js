/**
 * @typedef {Object} InstructMessageModel
 * @property {string} [instruction] - User provided prompt instead of predefined template.
 * @property {string} [template] - The template name.
 */

/**
 * @typedef {Object} IncomingInstructRequest
 * @property {string} text
 * @property {string} [agentId]
 * @property {string} [instruction]
 * @property {string} [provider]
 * @property {string} [model]
 * @property {import('$conversationTypes').ConversationStateModel[]} [states]
 */

export default {};