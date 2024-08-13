import { PUBLIC_SERVICE_URL } from '$env/static/public';
export const host = PUBLIC_SERVICE_URL;

export const endpoints = {
    // user
    tokenUrl: `${host}/token`,
    myInfoUrl: `${host}/user/me`,
    usrCreationUrl: `${host}/user`,
    userAvatarUrl: `${host}/user/avatar`,
    
    // setting
    settingListUrl: `${host}/settings`,
    settingDetailUrl: `${host}/setting/{id}`,

    // plugin
    pluginListUrl: `${host}/plugins`,
    pluginMenuUrl: `${host}/plugin/menu`,
    pluginInstallUrl: `${host}/plugin/{id}/install`,
    pluginRemoveUrl: `${host}/plugin/{id}/remove`,
    
    // agent
    agentSettingUrl: `${host}/agent/settings`,
    agentListUrl: `${host}/agents`,
    agentDetailUrl: `${host}/agent/{id}`,
    agentRefreshUrl: `${host}/refresh-agents`,
    agentCreateUrl: `${host}/agent`,
    agentUtilitiesUrl: `${host}/agent/utilities`,
    
    // agent task
    agentTaskListUrl: `${host}/agent/tasks`,
    agentTaskDetailUrl: `${host}/agent/{agentId}/task/{taskId}`,

    // agent instruct
    instructCompletionUrl: `${host}/instruct/{agentId}`,

    // router
    routerSettingUrl: `${host}/router/settings`,

    // conversation
    conversationInitUrl: `${host}/conversation/{agentId}`,
    conversationMessageUrl: `${host}/conversation/{agentId}/{conversationId}`,
    conversationsUrl: `${host}/conversations`,
    conversationCountUrl: `${host}/conversations/count`,
    conversationDeletionUrl: `${host}/conversation/{conversationId}`,
    conversationDetailUrl: `${host}/conversation/{conversationId}`,
    conversationAttachmentUrl: `${host}/conversation/{conversationId}/files/{messageId}/{source}`,
    conversationUserUrl: `${host}/conversation/{conversationId}/user`,
    dialogsUrl: `${host}/conversation/{conversationId}/dialogs`,
    conversationMessageDeletionUrl: `${host}/conversation/{conversationId}/message/{messageId}`,
    fileUploadUrl: `${host}/agent/{agentId}/conversation/{conversationId}/upload`,
    
    // LLM provider
    llmProvidersUrl: `${host}/llm-providers`,
    llmProviderModelsUrl: `${host}/llm-provider/{provider}/models`,

    // logging
    loggingFullLogUrl: `${host}/logger/full-log`,
    loggingContentLogUrl: `${host}/logger/conversation/{conversationId}/content-log`,
    loggingStateLogUrl: `${host}/logger/conversation/{conversationId}/state-log`,
    
    // knowledge base
    knowledgeBaseCollectionsUrl: `${host}/knowledge/collections`,
    knowledgeBaseDataListUrl: `${host}/knowledge/{collection}/data`,
    knowledgeBaseSearchUrl: `${host}/knowledge/{collection}/search`,
    knowledgeBaseDeleteDataUrl: `${host}/knowledge/{collection}/data/{id}`,
    knowledgeBaseUploadUrl: `${host}/knowledge/{collection}/upload`,

    // chathub 
    chatHubUrl: `${host}/chatHub`,

    // Google geocode api
    addressUrl: `${host}/address/options`
}

