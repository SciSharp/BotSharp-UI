const userRole = {
    System: "system",
    Admin: "admin",
    User: "user",
    Client: "client",
    Function: "function",
    Engineer: "engineer",
    Csr: "csr",
    Technician: "technician",
    Operation: "operation",
    Assistant: "assistant",
    Bot: "bot",
    Root: "root"
};
export const UserRole = Object.freeze(userRole);

const senderAction = {
    TypingOn: 1,
    TypingOff: 2,
    MarkSeen: 3
}
export const SenderAction = Object.freeze(senderAction);

const richType = {
    Text: 'text',
    QuickReply: 'quick_reply',
    Button: 'button_template',
    MultiSelect: 'multi-select_template',
    Generic: 'generic_template',
    Upload: 'upload_template',
    ProgramCode: 'program_code',
}
export const RichType = Object.freeze(richType);

const elementType = {
    Text: "text",
    Video: "video",
    File: "file",
    Web: "web_url"
};
export const ElementType = Object.freeze(elementType);

const contentLogSource = {
    UserInput: "user input",
    Prompt: "prompt",
    FunctionCall: "function call",
    AgentResponse: "agent response",
    HardRule: "hard rule",
    Notification: "notification"
};
export const ContentLogSource = Object.freeze(contentLogSource);

const editorType = {
    None: "none",
    Text: "text",
    Address: "address",
    Phone: "phone",
    DateTimePicker: "datetime-picker",
    DateTimeRangePicker: 'datetime-range-picker',
    Email: 'email',
    File: 'file'
};
export const EditorType = Object.freeze(editorType);

const fileSourceType = {
    User: 'user',
    Bot: 'bot'
};
export const FileSourceType = Object.freeze(fileSourceType);

const agentType = {
    Routing: 'routing',
    Task: 'task',
    Static: 'static',
    Evaluating: 'evaluating',
    Planning: 'planning'
};
export const AgentType = Object.freeze(agentType);

const routingMode = {
    Eager: "eager",
    Lazy: "lazy"
};
export const RoutingMode = Object.freeze(routingMode);

const functionVisMode = {
    Manual: "manual",
    Auto: "auto"
};
export const FunctionVisMode = Object.freeze(functionVisMode);

const agentTaskStatus = {
    Scheduled: 'scheduled',
    New: 'new',
    Running: 'running',
    Success: 'success',
    Failed: 'failed'
};
export const AgentTaskStatus = Object.freeze(agentTaskStatus);


const knowledgeCollectionType = {
    QuestionAnswer: 'question-answer',
    Document: 'document'
};
export const KnowledgeCollectionType = Object.freeze(knowledgeCollectionType);

const knowledgeCollectionDisplayType =  {
    [knowledgeCollectionType.QuestionAnswer]: "Q & A",
    [knowledgeCollectionType.Document]: "Documents",
};
export const KnowledgeCollectionDisplayType = Object.freeze(knowledgeCollectionDisplayType);

const knowledgePayloadName = {
    Text: 'text',
    Question: 'question',
    Answer: 'answer',
    DataSource: 'dataSource',
    FileId: 'fileId',
    FileName: 'fileName',
    FileSource: 'fileSource',
    FileUrl: 'fileUrl'
};
export const KnowledgePayloadName = Object.freeze(knowledgePayloadName);

const vectorPayloadDataType = {
    String: Object.freeze({ id: 1, name: 'String' }),
    Boolean: Object.freeze({ id: 2, name: 'Boolean' }),
    Integer: Object.freeze({ id: 3, name: 'Integer' }),
    Double: Object.freeze({ id: 4, name: 'Double' }),
    Datetime: Object.freeze({ id: 5, name: 'Datetime' }),
};
export const VectorPayloadDataType = Object.freeze(vectorPayloadDataType);

const vectorIndexSchemaType = {
    Text: "text",
    Integer: "integer",
    Float: "float",
    Boolean: "bool",
    Datetime: "datetime"
};
export const VectorIndexSchemaType = Object.freeze(vectorIndexSchemaType);

const vectorDataSource = {
    Api: 'api',
    User: 'user',
    File: 'file'
};
export const VectorDataSource = Object.freeze(vectorDataSource);

const knowledgeDocSource = {
    Api: 'api',
    User: 'user',
    Web: 'web'
};
export const KnowledgeDocSource = Object.freeze(knowledgeDocSource);

const chatAction = {
    Open: 'open',
    Close: 'close',
    Logout: 'logout',
    Chat: 'chat',
    NewChat: 'new-chat',
    ReceiveNotification: 'receive-notification'
};
export const ChatAction = Object.freeze(chatAction);

const conversationTag = {
    Evaluation: "evaluation-set",
    Test: "test-set"
};
export const ConversationTag = Object.freeze(conversationTag);

const conversationChannel = {
    WebChat: "Web Chat",
    OpenAPI: "Open Api",
    Phone: "Phone",
    SMS: "Sms",
    Messenger: "Messenger",
    Email: "Email",
    Crontab: "Crontab",
    Database: "Database"
};
export const ConversationChannel = Object.freeze(conversationChannel);

const userPermission = {
    CreateAgent: "create-agent"
};
export const UserPermission = Object.freeze(userPermission);

const userAction = {
    Edit: "edit",
    Train: "train",
    Evaluate: "evaluate",
    Chat: "chat"
};
export const UserAction = Object.freeze(userAction);

const globalEvent = {
    Search: "search",
    Chat: "chat"
};
export const GlobalEvent = Object.freeze(globalEvent);

const llmModelType = {
    Text: 1,
    Chat: 2,
    Image: 3,
    Embedding: 4,
    Audio: 5
};
export const LlmModelType = Object.freeze(llmModelType);

const reasoningEffortLevel = {
    Minimal: "minimal",
    Low: "low",
    Medium: "medium",
    High: "high"
};
export const ReasoningEffortLevel = Object.freeze(reasoningEffortLevel);

const timeRange = {
    Last15Minutes: "Last 15 minutes",
    Last30Minutes: "Last 30 minutes",
    Last1Hour: "Last 1 hour",
    Last3Hours: "Last 3 hours",
    Last12Hours: "Last 12 hours",
    Today: "Today",
    Yesterday: "Yesterday",
    Last3Days: "Last 3 days",
    Last7Days: "Last 7 days",
    Last30Days: "Last 30 days",
    Last90Days: "Last 90 days",
    Last180Days: "Last 180 days",
    LastYear: "Last year"
};
export const TimeRange = Object.freeze(timeRange);