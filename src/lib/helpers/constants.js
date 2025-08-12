import { EditorType, TimeRange, UserRole } from "./enums";

export const CHAT_FRAME_ID = "chatbox-frame";

export const USER_SENDERS = [
    UserRole.Admin,
    UserRole.User,
    UserRole.Client,
    UserRole.Root,
    UserRole.Engineer,
    UserRole.Csr,
    UserRole.Technician,
    UserRole.Operation
];

export const ADMIN_ROLES = [
    UserRole.Admin,
    UserRole.Root
];

export const BOT_SENDERS = [
    UserRole.Assistant,
    UserRole.Bot,
    UserRole.System
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

export const INTEGER_REGEX = "[0-9]+";
export const DECIMAL_REGEX = "[0-9.]+";

export const TIME_RANGE_OPTIONS = [
    { label: TimeRange.Last15Minutes, value: TimeRange.Last15Minutes, qty: 15, unit: 'minutes' },
    { label: TimeRange.Last30Minutes, value: TimeRange.Last30Minutes, qty: 30, unit: 'minutes' },
    { label: TimeRange.Last1Hour, value: TimeRange.Last1Hour, qty: 1, unit: 'hours' },
    { label: TimeRange.Last3Hours, value: TimeRange.Last3Hours, qty: 3, unit: 'hours' },
    { label: TimeRange.Last12Hours, value: TimeRange.Last12Hours, qty: 12, unit: 'hours' },
    { label: TimeRange.Today, value: TimeRange.Today, qty: 1, unit: 'days' },
    { label: TimeRange.Yesterday, value: TimeRange.Yesterday, qty: 1, unit: 'days' },
    { label: TimeRange.Last3Days, value: TimeRange.Last3Days, qty: 3, unit: 'days' },
    { label: TimeRange.Last7Days, value: TimeRange.Last7Days, qty: 7, unit: 'days' },
    { label: TimeRange.Last30Days, value: TimeRange.Last30Days, qty: 30, unit: 'days' },
    { label: TimeRange.Last90Days, value: TimeRange.Last90Days, qty: 90, unit: 'days' },
    { label: TimeRange.Last180Days, value: TimeRange.Last180Days, qty: 180, unit: 'days' },
    { label: TimeRange.LastYear, value: TimeRange.LastYear, qty: 365, unit: 'days' }
];