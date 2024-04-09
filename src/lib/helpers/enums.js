const userRole = {
    System: "system",
    Admin: "admin",
    User: "user",
    Client: "client",
    Function: "function",
    Assistant: "assistant"
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
    Generic: 'generic_template'
}
export const RichType = Object.freeze(richType);

const contentLogSource = {
    UserInput: "user input",
    Prompt: "prompt",
    FunctionCall: "function call",
    AgentResponse: "agent response",
    HardRule: "hard rule"
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