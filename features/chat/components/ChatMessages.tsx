/**
 * ChatMessages Component
 * 
 * Messages list container with scroll management
 * 
 * @example
 * ```tsx
 * <ChatMessages
 *   messages={messages}
 *   messagesContainerRef={ref}
 *   chatId={chatId}
 *   isLoading={isLoading}
 *   loadingTools={loadingTools}
 *   onRegenerate={handleRegenerate}
 *   append={append}
 *   user={user}
 * />
 * ```
 */

'use client';

import { Message as PreviewMessage } from '@/components/chat/Message';

import type { Message, Attachment } from 'ai';

interface ChatMessagesProps {
  messages: Array<Message>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  chatId: string;
  isLoading: boolean;
  loadingTools?: Set<string>;
  streamingContentRef: React.MutableRefObject<string>;
  onRegenerate?: () => void;
  append?: (message: Partial<Message>) => Promise<string | null | undefined>;
  user?: any;
}

export function ChatMessages({
  messages,
  messagesContainerRef,
  chatId,
  isLoading,
  loadingTools,
  streamingContentRef,
  onRegenerate,
  append,
  user,
}: ChatMessagesProps) {
  if (messages.length === 0) return null;

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col gap-4 size-full items-center overflow-y-auto px-4"
    >
      {messages.map((message, index) => {
        const isLast = index === messages.length - 1;
        return (
          <div
            id={`msg-${message.id}`}
            key={message.id}
            className={`w-full flex justify-center ${
              index === 0 ? "pt-20" : ""
            }`}
          >
            <PreviewMessage
              chatId={chatId}
              role={message.role}
              content={message.content}
              attachments={message.experimental_attachments}
              toolInvocations={message.toolInvocations}
              onRegenerate={onRegenerate}
              isLastMessage={isLast}
              isGenerating={
                isLoading &&
                isLast &&
                message.role === "assistant"
              }
              onAppendMessage={append}
              // Only pass loadingTools to the last message - prevents previous messages
              // from showing loading states when new tools execute
              loadingTools={isLast ? loadingTools : undefined}
              name={(message as any).name} // Internal sender identifier (usually user ID)
              currentUserId={user?.id}
              currentUserDisplayName={
                user?.name || user?.email || user?.id
              }
            />
          </div>
        );
      })}

      {/* Show "Thinking..." shimmer when loading but no assistant message exists yet */}
      {isLoading &&
        (messages.length === 0 ||
          messages[messages.length - 1]?.role === "user") &&
        !streamingContentRef.current && (
          <PreviewMessage
            key="thinking-placeholder"
            chatId={chatId}
            role="assistant"
            content=""
            isGenerating={true}
            toolInvocations={undefined}
            onAppendMessage={append}
            loadingTools={loadingTools}
          />
        )}

      {/* Spacer for proper scrolling */}
      <div className="shrink-0 min-w-[24px] min-h-[24px]" />
    </div>
  );
}
