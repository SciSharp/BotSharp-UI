/**
 * @typedef {Object} AgentWelcomeInfo
 * @property {string[]} messages - The welcome messages in Rich content format.
 */

/**
 * @typedef {Object} AgentTemplate
 * @property {string?} [uid]
 * @property {string} name
 * @property {string} content
 */

/**
 * @typedef {Object} AgentLlmConfig
 * @property {boolean} is_inherit - Inherited from default Agent settings
 * @property {string?} provider 
 * @property {string?} model
 * @property {number} max_recursion_depth
 * @property {number?} [max_output_tokens]
 */


/**
 * @typedef {Object} RouterSettings
 * @property {string} planner
 */


/** 
 * @typedef {Object} AgentFilter
 * @property {import('$commonTypes').Pagination} pager - Pagination
 * @property {string[]?} [types]
 * @property {string[]?} [agentNames]
 * @property {string} [similarName]
 * @property {string[]?} [labels]
 * @property {boolean} [isPublic]
 * @property {boolean} [disabled]
 * @property {string[]?} [agentIds]
 */

/**
 * @typedef {Object} AgentModel
 * @property {string} id - Agent Id.
 * @property {string} name - Agent name.
 * @property {string} description - Agent description.
 * @property {string} type - Agent type
 * @property {string?} mode - Agent routing mode
 * @property {string} instruction - System prompt
 * @property {ChannelInstruction[]} channel_instructions - Channel instructions
 * @property {boolean} disabled
 * @property {boolean} is_public
 * @property {boolean} is_host
 * @property {boolean} is_router
 * @property {boolean} allow_routing
 * @property {string} icon_url - Icon
 * @property {string[]} profiles - The agent profiles.
 * @property {string[]} labels - The agent labels.
 * @property {boolean} merge_utility - Merge utility
 * @property {number?} [max_message_count]
 * @property {AgentUtility[]} utilities - The agent utilities.
 * @property {AgentMcpTool[]} mcp_tools - The agent mcp tools
 * @property {AgentKnowledgeBase[]} knowledge_bases - The agent knowledge bases.
 * @property {Date} created_datetime
 * @property {Date} updated_datetime
 * @property {AgentLlmConfig} llm_config - LLM settings.
 * @property {import('$pluginTypes').PluginDefModel} plugin
 * @property {FunctionDef[]} functions
 * @property {AgentTemplate[]} templates
 * @property {Object[]} responses
 * @property {RoutingRule[]} routing_rules
 * @property {AgentRule[]} rules
 * @property {AgentWelcomeInfo} welcome_info - Welcome information.
 * @property {string[]?} [actions]
 */


/**
 * @typedef {Object} AgentSettings
 * @property {string} dataDir
 * @property {string} templateFormat
 * @property {AgentLlmConfig} llmConfig - LLM settings.
 */

/** 
 * @typedef {Object} AgentTaskFilter
 * @property {import('$commonTypes').Pagination} pager - Pagination
 * @property {string} [agentId] - The agent id.
 * @property {string?} [status] - The agent task status.
 */

/**
 * @typedef {Object} AgentTaskModel
 * @property {string} id - Task id.
 * @property {string} name - Task name.
 * @property {string} description - Description.
 * @property {string} content - Task detail.
 * @property {boolean} enabled
 * @property {string} status
 * @property {Date} created_time
 * @property {Date} updated_time
 * @property {string} agent_id - Description.
 * @property {string} agent_name - Task detail.
 * @property {string} [direct_agent_id] - Run task directly in this agent.
 */

/**
 * @typedef {Object} ChannelInstruction
 * @property {string} [uid]
 * @property {string} channel 
 * @property {string} instruction
 */

/**
 * @typedef {Object} RoutingRule
 * @property {string} type
 * @property {string} field
 * @property {string} description
 * @property {string} fieldType
 * @property {boolean} required
 * @property {string} redirectTo
 * @property {string?} [redirect_to_agent]
 */


/**
 * @typedef {Object} FunctionDef
 * @property {string} name 
 * @property {string} description
 */


/**
 * @typedef {Object} AgentUtility
 * @property {string} category 
 * @property {string} name 
 * @property {boolean} disabled
 * @property {string?} [visibility_expression]
 * @property {UtilityItem[]} items
 */

/**
 * @typedef {Object} UtilityItem
 * @property {string?} [function_name]
 * @property {string?} [function_display_name]
 * @property {string?} [template_name]
 * @property {string?} [template_display_name]
 * @property {string?} [visibility_expression]
 * @property {string?} [description]
 */

/**
 * @typedef {Object} AgentMcpTool
 * @property {string} name
 * @property {string} server_id 
 * @property {boolean} disabled 
 * @property {import('$commonTypes').NameBase[]} functions
 */

/**
 * @typedef {Object} AgentKnowledgeBase
 * @property {string} name 
 * @property {string} type
 * @property {string?} [displayName]
 * @property {boolean} disabled
 * @property {number?} [confidence]
 */

/**
 * @typedef {Object} AgentRule
 * @property {string} trigger_name 
 * @property {string} criteria
 * @property {string?} [displayName]
 * @property {boolean} disabled
 */


/**
 * @typedef {Object} AgentTaskSearchOption
 * @property {string?} [agentId]
 * @property {string?} [status]
 */


export default {};