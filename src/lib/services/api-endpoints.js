import { PUBLIC_SERVICE_URL } from '$env/static/public';
export const host = PUBLIC_SERVICE_URL;

export const endpoints = {
    // user
    tokenUrl: `${host}/token`,
    myInfoUrl: `${host}/user/my`,
    usrCreationUrl: `${host}/user`,
    
    // plugin
    pluginListUrl: `${host}/plugins`,
    
    // agent
    agentSettingUrl: `${host}/agent/settings`,
    agentListUrl: `${host}/agents`,
    agentDetailUrl: `${host}/agent/{id}`,
    
    // router
    routerSettingUrl: `${host}/router/settings`,

    // conversation
    conversationInitUrl: `${host}/conversation/{agentId}`,
    conversationMessageUrl: `${host}/conversation/{agentId}/{conversationId}`,
    conversationsUrl: `${host}/conversations`,
    conversationCountUrl: `${host}/conversations/count`,
    conversationDeletionUrl: `${host}/conversation/{conversationId}`,
    conversationDetailUrl: `${host}/conversation/{conversationId}`,
    dialogsUrl: `${host}/conversation/{conversationId}/dialogs`,
    
    // knowledge base
    knowledgeBaseUploadUrl: `${host}/knowledge-base/upload`,

    // chathub 
    chatHubUrl: `${host}/chatHub`,
}

