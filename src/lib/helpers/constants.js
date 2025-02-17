import { EditorType, UserRole } from "./enums";

export const CHAT_FRAME_ID = "chatbox-frame";

export const USER_SENDERS = [
    UserRole.Admin,
    UserRole.User,
    UserRole.Client,
    UserRole.Root
];

export const ADMIN_ROLES = [
    UserRole.Admin,
    UserRole.Root
];

export const BOT_SENDERS = [
    UserRole.Assistant
];

export const TEXT_EDITORS = [
    EditorType.Text,
    EditorType.Address,
    EditorType.Phone,
    EditorType.Email,
    EditorType.DateTimePicker,
    EditorType.DateTimeRangePicker
];

export const FILE_EDITORS = [
    EditorType.File
];

export const LEARNER_ID = "01acc3e5-0af7-49e6-ad7a-a760bd12dc40";
export const EVALUATOR_ID = "2cd4b805-7078-4405-87e9-2ec9aadf8a11";
export const TRAINING_MODE = "training";

export const DEFAULT_KNOWLEDGE_COLLECTION = "BotSharp";
export const IMAGE_DATA_PREFIX = 'data:image';