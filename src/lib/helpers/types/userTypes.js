/**
 * @typedef {Object} UserModel
 * @property {string} id - The user id.
 * @property {string} [user_name] - User name
 * @property {string} [first_name] - The user first name.
 * @property {string} [last_name] - The user last name.
 * @property {string} [full_name] - The user full name.
 * @property {string} [email] - The user email.
 * @property {string} source - Account source.
 * @property {string?} [type] - Account source.
 * @property {string} [external_id] - The user external id.
 * @property {string[]} permissions - Permissions.
 * @property {UserAgentAction[]} agent_actions - Agent actions
 * @property {string} [create_date] - The user create date.
 * @property {string} [update_date] - The user update date.
 * @property {string} [role] - The user role.
 * @property {string} [avatar] - The user avatar.
 * @property {string} [color]
 * @property {string} [token]
 */

/**
 * @typedef {Object} UserAgentAction
 * @property {string} agent_id - The agent id
 * @property {import('$agentTypes').AgentModel} [agent] - The agent details
 * @property {string[]} actions - The actions
 */

/**
 * @typedef {Object} UserFilter
 * @property {number} page - The page number
 * @property {number} size - The page size
 * @property {string[]} [user_ids] - The user ids.
 * @property {string[]} [user_names] - The user names
 * @property {string[]} [roles] - The roles.
 * @property {string[]} [sources] - The sources.
 * @property {string[]} [external_ids] - The external ids.
 */

export default {};