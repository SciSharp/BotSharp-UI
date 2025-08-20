import { PUBLIC_SERVICE_URL } from '$env/static/public';
export const host = PUBLIC_SERVICE_URL;

export const endpoints = {
    // role
    roleOptionsUrl: `${host}/role/options`,
    rolesUrl: `${host}/roles`,
    roleDetailUrl: `${host}/role/{id}/details`,
    roleUpdateUrl: `${host}/role`,

    // user
    tokenUrl: `${host}/token`,
    myInfoUrl: `${host}/user/me`,
    usersUrl: `${host}/users`,
    userDetailUrl: `${host}/user/{id}/details`,
    userUpdateUrl: `${host}/user`,
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
    agentOptionsUrl: `${host}/agent/options`,
    agentDetailUrl: `${host}/agent/{id}`,
    agentRefreshUrl: `${host}/refresh-agents`,
    agentCreateUrl: `${host}/agent`,
    agentUtilityOptionsUrl: `${host}/agent/utility/options`,
    agentRuleOptionsUrl: `${host}/rule/triggers`,
    agentLabelsUrl: `${host}/agent/labels`,
    
    // agent task
    agentTaskListUrl: `${host}/agent/tasks`,
    agentTaskDetailUrl: `${host}/agent/{agentId}/task/{taskId}`,
    agentTaskUpdateUrl: `${host}/agent/{agentId}/task/{taskId}`,

    // agent instruct
    instructCompletionUrl: `${host}/instruct/{agentId}`,
    chatCompletionUrl: `${host}/instruct/chat-completion`,
    instructLogUrl: `${host}/logger/instruction/log`,
    instructLogSearchKeysUrl: `${host}/logger/instruction/log/keys`,

    // agent realtime interaction
    agentInitRealtimeSessionUrl: `${host}/agent/{agentId}/realtime/session`,
    agentFunctionCallUrl: `${host}/agent/{agentId}/function/{functionName}/execute`,

    // router
    routerSettingUrl: `${host}/router/settings`,

    // conversation
    conversationInitUrl: `${host}/conversation/{agentId}`,
    conversationMessageUrl: `${host}/conversation/{agentId}/{conversationId}`,

    notificationUrl: `${host}/conversation/{conversationId}/notification`,
    conversationsUrl: `${host}/conversations`,
    conversationCountUrl: `${host}/conversations/count`,
    conversationDeletionUrl: `${host}/conversation/{conversationId}`,
    conversationDetailUrl: `${host}/conversation/{conversationId}`,
    conversationAttachmentUrl: `${host}/conversation/{conversationId}/files/{messageId}/{source}`,
    conversationUserUrl: `${host}/conversation/{conversationId}/user`,
    dialogsUrl: `${host}/conversation/{conversationId}/dialogs`,
    conversationMessageDeletionUrl: `${host}/conversation/{conversationId}/message/{messageId}`,
    conversationMessageUpdateUrl: `${host}/conversation/{conversationId}/update-message`,
    conversationTagsUpdateUrl: `${host}/conversation/{conversationId}/update-tags`,
    fileUploadUrl: `${host}/agent/{agentId}/conversation/{conversationId}/upload`,
    pinConversationUrl: `${host}/agent/{agentId}/conversation/{conversationId}/dashboard`,
    conversationStateSearchKeysUrl: `${host}/conversation/state/keys`,
    
    // LLM provider
    llmProvidersUrl: `${host}/llm-providers`,
    llmProviderModelsUrl: `${host}/llm-provider/{provider}/models`,
    llmConfigsUrl: `${host}/llm-configs`,

    // logging
    loggingFullLogUrl: `${host}/logger/full-log`,
    loggingContentLogUrl: `${host}/logger/conversation/{conversationId}/content-log`,
    loggingStateLogUrl: `${host}/logger/conversation/{conversationId}/state-log`,
    
    // knowledge base
    vectorCollectionExistUrl: `${host}/knowledge/vector/{collection}/exist`,
    vectorCollectionsUrl: `${host}/knowledge/vector/collections`,
    vectorCollectionDetailsUrl: `${host}/knowledge/vector/{collection}/details`,
    vectorKnowledgePageListUrl: `${host}/knowledge/vector/{collection}/page`,
    vectorKnowledgeSearchUrl: `${host}/knowledge/vector/{collection}/search`,
    vectorKnowledgeCreateUrl: `${host}/knowledge/vector/{collection}/create`,
    vectorKnowledgeUpdateUrl: `${host}/knowledge/vector/{collection}/update`,
    vectorKnowledgeDeleteUrl: `${host}/knowledge/vector/{collection}/data/{id}`,
    vectorKnowledgeDeleteAllUrl: `${host}/knowledge/vector/{collection}/data`,
    vectorKnowledgeUploadUrl: `${host}/knowledge/vector/{collection}/upload`,
    vectorCollectionCreateUrl: `${host}/knowledge/vector/create-collection`,
    vectorCollectionDeleteUrl: `${host}/knowledge/vector/{collection}/delete-collection`,
    vectorIndexesCreateUrl: `${host}/knowledge/vector/{collection}/payload/indexes`,
    vectorIndexesDeleteUrl: `${host}/knowledge/vector/{collection}/payload/indexes`,
    
    graphKnowledgeSearchUrl: `${host}/knowledge/graph/search`,

    knowledgeDocumentUploadUrl: `${host}/knowledge/document/{collection}/upload`,
    knowledgeDocumentDeleteUrl: `${host}/knowledge/document/{collection}/delete/{fileId}`,
    knowledgeDocumentDeleteAllUrl: `${host}/knowledge/document/{collection}/delete`,
    knowledgeDocumentPageListUrl: `${host}/knowledge/document/{collection}/page`,

    // chathub 
    chatHubUrl: `${host}/chatHub`,

    // dashboard
    dashboardSettingUrl: `${host}/dashboard/components`,
    dashConversationInstructionUrl: `${host}/dashboard/component/conversation`,

    // Google geocode api
    addressUrl: `${host}/address/options`,

    mcpServerConfigsUrl: `${host}/mcp/server-configs`
}

