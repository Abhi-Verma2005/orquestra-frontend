/**
 * ChatContent Component
 * 
 * Main chat UI component that orchestrates all chat functionality
 * Uses extracted hooks for business logic and state management
 * 
 * @example
 * ```tsx
 * <ChatContent id={chatId} initialMessages={messages} user={user} />
 * ```
 */

'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { Message, Attachment } from 'ai';

import { cn } from '@/lib/utils';
import { MultimodalInput } from '@/components/custom/multimodal-input';
import { RightPanel } from '@/components/custom/RightPanel';
import { useEnhancedClaudeScroll } from '@/hooks/use-scroll-to-bottom';
import { useCart } from '@/contexts/cart-context';
import { useChatUIState } from '@/contexts/chat-ui-state-context';
import { useSplitScreen } from '@/contexts/SplitScreenProvider';
import { useUserInfo } from '@/contexts/UserInfoProvider';
import { useWebSocket, MessageType } from '@/contexts/websocket-context';

import { useChatDrafts } from '../hooks/use-chat-drafts';
import { useChatJoin } from '../hooks/use-chat-join';
import { useChatMessages } from '../hooks/use-chat-messages';
import { useChatSubmission } from '../hooks/use-chat-submission';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { SidebarPanel } from './SidebarPanel';

interface ChatContentProps {
  id: string | null;
  initialMessages: Array<Message>;
  user?: any;
}

export function ChatContent({ id, initialMessages, user }: ChatContentProps) {
  const { userInfo } = useUserInfo();
  const { state: cartState, addItem: addItemToCart } = useCart();
  const { setRightPanelContent, isRightPanelOpen } = useSplitScreen();
  const {
    sendMessage,
    joinChat,
    onEvent,
    state: wsState,
  } = useWebSocket();
  const wsCtx = useWebSocket();

  // Use centralized UI state from context
  const {
    isThinking,
    isExecutingTool,
    isStreamingText,
    executingTools,
    isComplete,
    isIdle,
    toolInvocations: realtimeToolInvocations,
    resetState: resetUIState,
  } = useChatUIState();

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [chatExists, setChatExists] = useState(!!id);

  // Refs
  const stopRequestedRef = useRef(false);
  const lastUserMessageRef = useRef<string | null>(null);
  const streamingContentRef = useRef<string>("");

  // Use extracted hooks - messages first to get length
  const { messages, setMessages, resetStreamingState } = useChatMessages({
    chatId: id,
    initialMessages,
    onEvent,
    realtimeToolInvocations: realtimeToolInvocations as any,
    setRightPanelContent,
    setIsLoading,
    chatExists,
    user,
    isGroupChat,
    setIsGroupChat,
    setIsOwner,
    id,
    lastUserMessageRef,
    cartState,
    addItemToCart,
  });

  // Use drafts hook with actual messages length
  const { input, setInput } = useChatDrafts(id, messages.length);

  // Scroll management
  const lastMessageId = useMemo(() => {
    if (messages.length === 0) return undefined;
    return messages[messages.length - 1].id;
  }, [messages]);

  const [messagesContainerRef, scrollToMessage] = useEnhancedClaudeScroll<HTMLDivElement>(
    !isLoading,
    isLoading,
    lastMessageId
  );

  // Chat join logic (after scroll is set up)
  useChatJoin({
    chatId: id,
    user,
    wsState,
    joinChat,
    sendMessage,
    setMessages,
    setIsLoading,
    scrollToMessage,
    setChatExists,
    setIsGroupChat,
    setIsOwner,
    userInfo: userInfo ?? undefined,
    stopRequestedRef,
  });

  // Submission logic
  const { handleSubmit, isCreatingChat } = useChatSubmission({
    input,
    isLoading,
    id,
    user,
    messages,
    isGroupChat,
    sendMessage,
    setMessages,
    setInput,
    setIsLoading,
    scrollToMessage,
    resetStreamingState,
    resetUIState,
    setIsGroupChat,
    setIsOwner,
    setChatExists,
    stopRequestedRef,
    lastUserMessageRef,
    cartState,
  });

  // Stop generation
  const stop = useCallback(() => {
    stopRequestedRef.current = true;
    setIsLoading(false);
    try {
      (wsCtx as any).sendStop?.(id);
    } catch { }
  }, [id, wsCtx]);

  // Append message (for compatibility)
  const append = useCallback(
    async (message: Partial<Message>): Promise<string | null | undefined> => {
      const newMessage: Message = {
        id: message.id || `msg_${Date.now()}`,
        role: message.role || "user",
        content: message.content || "",
        ...message,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Scroll to top after adding message
      setTimeout(() => {
        if (newMessage.id) {
          scrollToMessage(`msg-${newMessage.id}`);
        }
      }, 0);

      // If it's a user message and WebSocket is connected, send it via WebSocket
      if (
        newMessage.role === "user" &&
        wsState === "connected" &&
        newMessage.content
      ) {
        sendMessage({
          chat_id: id!,
          user_id: user?.id,
          message: {
            room_id: id!,
            payload: {
              role: "user",
              content: newMessage.content,
            },
          },
        });
        setIsLoading(true);
        stopRequestedRef.current = false;

        // Clear any existing draft since a user message was sent via quick prompt
        if (typeof window !== "undefined") {
          try {
            const { NEW_CHAT_DRAFT_KEY, getPerChatDraftKey } = await import('../utils/draft-storage');
            localStorage.removeItem(NEW_CHAT_DRAFT_KEY);
            if (id) {
              localStorage.removeItem(getPerChatDraftKey(id));
            }
          } catch { }
        }
        setInput("");
      }

      return newMessage.id;
    },
    [
      wsState,
      id,
      sendMessage,
      scrollToMessage,
      user?.id,
      setMessages,
      setIsLoading,
      setInput,
    ]
  );

  // Regenerate function (placeholder - would need backend support)
  const handleRegenerate = useCallback(() => {
    // TODO: Implement regeneration via WebSocket
  }, []);

  // Loading tools from context
  const loadingTools = executingTools;

  return (
    <div className="h-dvh bg-background relative overflow-hidden">
      <PanelGroup direction="horizontal" className="size-full">
        {/* Left Sidebar Panel */}
        <Panel
          defaultSize={18}
          minSize={15}
          maxSize={25}
          collapsible={true}
          collapsedSize={4}
          onCollapse={() => setIsLeftSidebarCollapsed(true)}
          onExpand={() => setIsLeftSidebarCollapsed(false)}
          className={cn(
            "flex flex-col border-r border-border transition-all duration-300",
            isLeftSidebarCollapsed ? "min-w-[50px]" : ""
          )}
        >
          <SidebarPanel user={user} isCollapsed={isLeftSidebarCollapsed} />
        </Panel>

        <PanelResizeHandle className="w-[1px] bg-border hover:bg-primary/50 transition-colors" />

        {/* Main Chat Area */}
        <Panel
          defaultSize={62}
          minSize={30}
          className="flex flex-col relative h-full"
        >
          <div
            className={`flex flex-col pb-2 md:pb-4 transition-all duration-300 h-full ${messages.length === 0
              ? "justify-center items-center"
              : "justify-between"
              }`}
          >
            {/* Header with invite and members */}
            <ChatHeader
              id={id}
              isGroupChat={isGroupChat}
              user={user}
              isOwner={isOwner}
            />

            {/* Messages list */}
            <ChatMessages
              messages={messages}
              messagesContainerRef={messagesContainerRef}
              chatId={id!}
              isLoading={isLoading}
              loadingTools={loadingTools}
              streamingContentRef={useRef("")}
              onRegenerate={handleRegenerate}
              append={append}
              user={user}
            />

            {/* Input area */}
            <ChatInput
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              isCreatingChat={isCreatingChat}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              append={append}
            />
          </div>
        </Panel>

        {/* Right Panel */}
        {isRightPanelOpen && (
          <>
            <PanelResizeHandle className="w-[1px] bg-border hover:bg-primary/50 transition-colors relative z-10" />
            <Panel
              defaultSize={20}
              minSize={15}
              maxSize={40}
              className="flex flex-col bg-card/50"
            >
              <RightPanel />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
