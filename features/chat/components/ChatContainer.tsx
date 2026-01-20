/**
 * ChatContainer Component
 * 
 * Main wrapper component that provides ChatUIStateProvider context
 * Replaces the current Chat export from chat.tsx
 * 
 * @example
 * ```tsx
 * <ChatContainer id={chatId} initialMessages={messages} user={user} />
 * ```
 */

'use client';

import type { Message } from 'ai';

import { ChatUIStateProvider } from '@/contexts/chat-ui-state-context';

import { ChatContent } from './ChatContent';

interface ChatContainerProps {
  id: string | null;
  initialMessages: Array<Message>;
  user?: any;
}

export function ChatContainer({ id, initialMessages, user }: ChatContainerProps) {
  return (
    <ChatUIStateProvider chatId={id} initialMessages={initialMessages as any}>
      <ChatContent id={id} initialMessages={initialMessages} user={user} />
    </ChatUIStateProvider>
  );
}
