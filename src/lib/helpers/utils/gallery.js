import { EditorType, ElementType } from '../enums';

/**
 * @param {import('$conversationTypes').ChatResponseModel?} message
 */
export function loadFileGallery(message) {
    return  message?.rich_content?.editor === EditorType.File
    || message?.rich_content?.message?.buttons?.find(x => x.type == ElementType.File)
    || message?.rich_content?.message?.elements?.find(x => x.type == ElementType.File)
    || message?.rich_content?.message?.quick_replies?.find(x => x.type == ElementType.File)
    || message?.rich_content?.message?.options?.find(x => x.type == ElementType.File);
}