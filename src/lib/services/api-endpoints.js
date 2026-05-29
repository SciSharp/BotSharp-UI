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
    renewTokenUrl: `${host}/renew-token`,
    myInfoUrl: `${host}/user/me`,
    usersUrl: `${host}/users`,
    userDetailUrl: `${host}/user/{id}/details`,
    userUpdateUrl: `${host}/user`,
    usrCreationUrl: `${host}/user`,
    userAvatarUrl: `${host}/user/avatar`,

    //tenant
    userTenantsUrl: `${host}/tenants/options`,
    
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
    agentRuleOptionsByIdUrl: `${host}/rule/triggers/{agentId}`,
    agentLabelsUrl: `${host}/agent/labels`,

    // agent code script:
    agentCodeScriptListUrl: `${host}/agent/{agentId}/code-scripts`,
    agentCodeScriptUpdateUrl: `${host}/agent/{agentId}/code-scripts`,
    agentCodeScriptGenerateUrl: `${host}/agent/{agentId}/code-script/generate`,
    
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
    stopStreamingUrl: `${host}/conversation/{conversationId}/stop-streaming`,
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
    knowledgeCollectionExistUrl: `${host}/knowledge/collection/{collection}/exist`,
    knowledgeCollectionDetailsUrl: `${host}/knowledge/collection/{collection}/details`,
    knowledgeCollectionsUrl: `${host}/knowledge/collections`,
    knowledgeCollectionCreateUrl: `${host}/knowledge/collection`,
    knowledgeCollectionDeleteUrl: `${host}/knowledge/collection/{collection}`,

    knowledgeDataQueryUrl: `${host}/knowledge/collection/{collection}/query`,
    knowledgeDataPageListUrl: `${host}/knowledge/collection/{collection}/data/page`,
    knowledgeDataCreateUrl: `${host}/knowledge/collection/{collection}/data`,
    knowledgeDataUpdateUrl: `${host}/knowledge/collection/{collection}/data`,
    knowledgeDataDeleteUrl: `${host}/knowledge/collection/{collection}/data/{id}`,
    knowledgeDataDeleteAllUrl: `${host}/knowledge/collection/{collection}/data`,
    
    knowledgeIndexesCreateUrl: `${host}/knowledge/collection/{collection}/indexes`,
    knowledgeIndexesDeleteUrl: `${host}/knowledge/collection/{collection}/indexes`,

    knowledgeFileUploadUrl: `${host}/knowledge/collection/{collection}/file/upload`,
    knowledgeFileDeleteUrl: `${host}/knowledge/collection/{collection}/file/{fileId}`,
    knowledgeFileDeleteAllUrl: `${host}/knowledge/collection/{collection}/file`,
    knowledgeFilePageListUrl: `${host}/knowledge/collection/{collection}/file/page`,
    knowledgeProcessorsUrl: `${host}/knowledge/processors`,

    entityAnalyzersUrl: `${host}/knowledge/entity/analyzers`,
    entityDataProvidersUrl: `${host}/knowledge/entity/data-providers`,

    // chathub 
    chatHubUrl: `${host}/chatHub`,

    // dashboard
    dashboardSettingUrl: `${host}/dashboard/components`,
    dashConversationInstructionUrl: `${host}/dashboard/component/conversation`,

    // Google geocode api
    addressUrl: `${host}/address/options`,

    mcpServerConfigsUrl: `${host}/mcp/server-configs`
}

