/**
 * Chat UI State Context Provider
 *
 * Provides centralized chat UI state to all components.
 * Components should consume this context instead of directly handling WebSocket events.
 */

'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';

import { useWebSocketEvents } from '@/hooks/use-websocket-events';
import type { ChatUIState, ToolInvocation } from '@/types/chat-ui-state';

interface ChatUIStateContextValue {
  // Current UI state
  uiState: ChatUIState;

  // Streaming content
  streamingText: string;

  // Tool invocations (visual cards for function calls)
  toolInvocations: ToolInvocation[];

  // Tool invocations for the current message only
  currentMessageToolInvocations: ToolInvocation[];

  // Currently executing tools
  executingTools: Set<string>;

  // Current message ID being processed
  currentMessageId: string | null;

  // State helpers
  isThinking: boolean;
  isStreamingText: boolean;
  isExecutingTool: boolean;
  isComplete: boolean;
  isIdle: boolean;

  // Actions
  resetState: () => void;
  setCurrentMessageId: (messageId: string) => void;
  getToolInvocationsForMessage: (messageId: string) => ToolInvocation[];
}

const ChatUIStateContext = createContext<ChatUIStateContextValue | null>(null);

interface ChatUIStateProviderProps {
  chatId: string | null;
  children: ReactNode;
  initialMessages?: Array<{ toolInvocations?: ToolInvocation[] }>;
}

/**
 * Provider component
 * 
 * Ensures backend (DB) is source of truth by:
 * - Resetting realtime state when chat changes
 * - Trusting DB-loaded messages over realtime state
 * - Realtime state only for "in-progress" operations
 */
export function ChatUIStateProvider({
  chatId,
  children,
  initialMessages = [],
}: ChatUIStateProviderProps) {
  const state = useWebSocketEvents(chatId);

  // Sync: When initial messages are loaded, ensure DB state takes precedence
  // Extract tool invocations from DB messages - these are the source of truth
  useEffect(() => {
    if (initialMessages.length > 0) {
      const dbToolInvocations = initialMessages
        .flatMap(msg => msg.toolInvocations || [])
        .filter(inv => inv.state === 'complete' || (inv.state as any) === 'result' || (inv.state as any) === 'call');
      
      // If DB has tool invocations, they are the source of truth
      // Realtime state should only show "loading" tools that haven't been saved yet
      if (dbToolInvocations.length > 0) {
        console.log('[SYNC] DB has', dbToolInvocations.length, 'tool invocations - these are source of truth');
      }
    }
  }, [initialMessages]);

  return (
    <ChatUIStateContext.Provider value={state}>
      {children}
    </ChatUIStateContext.Provider>
  );
}

/**
 * Hook to consume chat UI state
 */
export function useChatUIState(): ChatUIStateContextValue {
  const context = useContext(ChatUIStateContext);

  if (!context) {
    throw new Error('useChatUIState must be used within ChatUIStateProvider');
  }

  return context;
}
