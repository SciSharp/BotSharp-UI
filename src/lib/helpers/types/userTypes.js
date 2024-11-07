/**
 * @typedef {Object} UserModel
 * @property {string} id - The user id.
 * @property {string} [user_name] - User name
 * @property {string} [first_name] - The user first name.
 * @property {string} [last_name] - The user last name.
 * @property {string} [full_name] - The user full name.
 * @property {string} [email] - The user email.
 * @property {string} source - Account source.
 * @property {string} [external_id] - The user external id.
 * @property {string} [create_date] - The user create date.
 * @property {string} [update_date] - The user update date.
 * @property {string} [role] - The user role.
 * @property {string} [avatar] - The user avatar.
 * @property {string} [color]
 * @property {string} [token]
 */

/**
 * @typedef {Object} DashboardModel
 * @property {DashboardConversation[]} [conversation_list] - conversation components
 */

/**
 * @typedef {Object} DashboardConversation
 * @property {string} [name] - The conversation name.
 * @property {string} [conversation_id] - The conversation id.
 * @property {string} [instruction] - The user input instruction.
 */
export default {};