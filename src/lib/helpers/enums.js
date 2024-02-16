const userRole = {
    System: "system",
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