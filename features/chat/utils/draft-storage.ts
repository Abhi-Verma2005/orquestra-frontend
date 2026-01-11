/**
 * Draft Storage Utilities
 * 
 * Handles localStorage management for chat drafts (per-chat and new-chat drafts)
 */

export const getPerChatDraftKey = (chatId: string) => `chat_draft_${chatId}`;
export const NEW_CHAT_DRAFT_KEY = `chat_draft_new`;
