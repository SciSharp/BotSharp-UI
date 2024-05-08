import { EditorType, UserRole } from "./enums";

export const USER_SENDERS = [
    UserRole.Admin,
    UserRole.User,
    UserRole.Client
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