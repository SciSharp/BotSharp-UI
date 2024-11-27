import { UserAction } from '../enums';

export const AgentExtensions = {
    chatable: (/** @type {import('$agentTypes').AgentModel} */ agent) => {
        if (agent == null || agent.id == null) {
            return false;
        }

        if (agent.actions == null) {
            return true;
        }
        return agent.actions.includes(UserAction.Chat);
    },
    editable: (/** @type {import('$agentTypes').AgentModel} */ agent) => {
        if (agent == null || agent.id == null) {
            return false;
        }

        if (agent.actions == null) {
            return true;
        }
        return agent.actions.includes(UserAction.Edit);
    },
    trainable: (/** @type {import('$agentTypes').AgentModel} */ agent) => {
        if (agent == null || agent.id == null) {
            return false;
        }

        if (agent.actions == null) {
            return true;
        }
        return agent.actions.includes(UserAction.Train);
    },
    evaluable: (/** @type {import('$agentTypes').AgentModel} */ agent) => {
        if (agent == null || agent.id == null) {
            return false;
        }

        if (agent.actions == null) {
            return true;
        }
        return agent.actions.includes(UserAction.Edit);
    },
};