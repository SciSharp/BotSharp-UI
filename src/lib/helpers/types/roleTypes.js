/**
 * @typedef {Object} RoleModel
 * @property {string} id - The user id.
 * @property {string} [name] - Role name
 * @property {string[]} permissions - Permissions.
 * @property {RoleAgentAction[]} agent_actions - Agent actions
 * @property {string} [create_date] - The user create date.
 * @property {string} [update_date] - The user update date.
 * @property {boolean} [open_detail]
 */

/**
 * @typedef {Object} RoleAgentAction
 * @property {string?} [id] - The id
 * @property {string} agent_id - The agent id
 * @property {import('$agentTypes').AgentModel} [agent] - The agent details
 * @property {string[]} actions - The actions
 */

/**
 * @typedef {Object} RoleAgentInnerAction
 * @property {string?} [id] - The id
 * @property {string} agent_id - The agent id
 * @property {string} [agent_name] - The agent name
 * @property {import('$agentTypes').AgentModel} [agent] - The agent details
 * @property {{ key: string, value: string, checked: boolean }[]} actions - The actions
 */

/**
 * @typedef {Object} RoleFilter
 * @property {string[]} [names] - The role names.
 */

export default {};