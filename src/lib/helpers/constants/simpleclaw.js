/**
 * The planner agent that decomposes a business request into SimpleClaw steps.
 *
 * Ships with the backend plugin as data (not created by hand), so the id is the same in
 * every environment and lives in source rather than in a .env.
 *
 * MUST match SimpleClawAgentId.Planner in
 * onebrain/Plugins/OneBrain.Plugin.SimpleClaw/Constants/SimpleClawAgentId.cs
 */
export const SIMPLECLAW_PLANNER_AGENT_ID = '501ea11b-79df-47a5-abbb-b5abe202a995';

/**
 * Route the SimpleClaw page is mounted at, matching the menu link the backend sends.
 * Compared against getCleanUrl(link), which strips a leading slash, so no slash here.
 */
export const SIMPLECLAW_ROUTE = 'simpleclaw';

/**
 * SimpleClaw stops a run that sits unanswered on a question for this long. It is not a
 * suggestion — an unattended caller that ignores an `ask` gets the run killed.
 */
export const ASK_TIMEOUT_MS = 10 * 60 * 1000;
