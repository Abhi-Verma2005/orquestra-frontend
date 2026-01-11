/**
 * Chat Feature Types
 * 
 * Type definitions specific to the chat feature
 */

import type { Message } from 'ai';

export interface ChatConfig {
  id: string | null;
  initialMessages: Array<Message>;
  user?: any;
}

export interface ChatInfo {
  isGroupChat: boolean;
  isOwner: boolean;
  chatExists: boolean;
  userId?: string;
}
