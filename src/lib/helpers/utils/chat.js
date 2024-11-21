/**
 * @param {string} action
 * @param {string} chatFrameId
 * @param {string | null} text
 * @param {import('$conversationTypes').MessageData | null} data
 */
export function sendToChatBot(action, chatFrameId, text = null, data = null) {
    const chatFrame = document.getElementById(chatFrameId);
    const content = { action: action, text: text, data: data };

    if (chatFrame) {
        // @ts-ignore
        chatFrame.contentWindow.postMessage(content, "*");
    }
}