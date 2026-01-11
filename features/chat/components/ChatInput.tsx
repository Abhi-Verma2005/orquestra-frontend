/**
 * ChatInput Component
 * 
 * Input area wrapper with MultimodalInput integration
 * 
 * @example
 * ```tsx
 * <ChatInput
 *   input={input}
 *   setInput={setInput}
 *   handleSubmit={handleSubmit}
 *   isLoading={isLoading}
 *   stop={stop}
 *   isCreatingChat={isCreatingChat}
 *   attachments={attachments}
 *   setAttachments={setAttachments}
 *   messages={messages}
 *   append={append}
 * />
 * ```
 */

'use client';

import type { Message, Attachment } from 'ai';
import { MultimodalInput } from '@/components/custom/multimodal-input';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (event?: { preventDefault?: () => void }) => Promise<void>;
  isLoading: boolean;
  stop: () => void;
  isCreatingChat: boolean;
  attachments: Array<Attachment>;
  setAttachments: (attachments: Array<Attachment>) => void;
  messages: Array<Message>;
  append: (message: Partial<Message>) => Promise<string | null | undefined>;
}

export function ChatInput({
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
  isCreatingChat,
  attachments,
  setAttachments,
  messages,
  append,
}: ChatInputProps) {
  return (
    <form className="flex flex-row gap-2 relative items-end w-full md:max-w-[650px] max-w-[calc(100dvw-32px)] px-4 mx-auto">
      <MultimodalInput
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
    </form>
  );
}
