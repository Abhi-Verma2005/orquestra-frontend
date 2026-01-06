"use client";

import { Attachment, Message } from "ai";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

import { MultimodalInput } from "./multimodal-input";
import { useUserInfo } from "../../contexts/UserInfoProvider";
import { useWebSocket, MessageType } from "../../contexts/websocket-context";

const NEW_CHAT_DRAFT_KEY = `chat_draft_new`;

export function Chat({
  initialMessages,
}: {
  initialMessages: Array<Message>;
}) {
  const router = useRouter();
  const { userInfo } = useUserInfo();
  const { sendMessage, state: wsState } = useWebSocket();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const [messages] = useState<Array<Message>>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const saveDraftTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  
  // Restore draft from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length === 0) {
      try {
        const saved = localStorage.getItem(NEW_CHAT_DRAFT_KEY);
        if (typeof saved === "string") {
          setInput(saved);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [messages.length]);

  // Save draft to localStorage whenever input changes (debounced)
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length === 0) {
      // Clear previous timeout
      if (saveDraftTimeoutRef.current) {
        clearTimeout(saveDraftTimeoutRef.current);
      }
      // Save after 300ms of no typing
      saveDraftTimeoutRef.current = setTimeout(() => {
        try {
          if (input.trim()) {
            localStorage.setItem(NEW_CHAT_DRAFT_KEY, input);
          } else {
            // Clear if empty
            localStorage.removeItem(NEW_CHAT_DRAFT_KEY);
          }
        } catch {
          // Ignore localStorage errors (quota exceeded, etc.)
        }
      }, 300);
      return () => {
        if (saveDraftTimeoutRef.current) {
          clearTimeout(saveDraftTimeoutRef.current);
        }
      };
    }
  }, [input, messages.length]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (event?: { preventDefault?: () => void }) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }

      if (!input.trim() || isLoading) {
        return;
      }

      const trimmedInput = input.trim();

      const userMsg: Message = {
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        role: "user",
        content: trimmedInput,
      };

      // Only create chat if no messages exist
      if (messages.length === 0) {
        try {
          setIsCreatingChat(true);
          
          // Create new chat
          const res = await fetch("/api/chat/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMsg }),
          });
          
          if (!res.ok) {
            console.error(
              "[Chat] Failed to create chat:",
              res.status,
              res.statusText
            );
            setIsCreatingChat(false);
            return;
          }
          
          const data = await res.json();
          const newId = data?.id as string;
          
          if (!newId) {
            setIsCreatingChat(false);
            return;
          }

          // Store pending message to be sent when navigating to new chat
          try {
            const pendingData = {
              message: userMsg,
            };
            sessionStorage.setItem(
              `pending_first_message_${newId}`,
              JSON.stringify(pendingData)
            );
            localStorage.removeItem(NEW_CHAT_DRAFT_KEY);
          } catch {}

          setIsLoading(true);
          
          // Navigate to new chat
          console.log("Navigating to new chat:", newId);
          router.push(`/chat/${newId}`);
          return;
        } catch (e) {
          console.error("[Chat] Exception creating chat:", e);
          setIsCreatingChat(false);
          return;
        }
      }
    },
    [input, isLoading, messages.length, router]
  );

  // Stop generation
  const stop = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Append message (for compatibility with MultimodalInput)
  const append = useCallback(
    async (message: Partial<Message>): Promise<string | null | undefined> => {
      const newMessage: Message = {
        id: message.id || `msg_${Date.now()}`,
        role: message.role || "user",
        content: message.content || "",
        ...message,
      };

      // Set input to the message content to trigger handleSubmit
      if (newMessage.role === "user" && newMessage.content) {
        setInput(newMessage.content);
        // Trigger submit after a brief delay to allow state to update
        setTimeout(() => {
          handleSubmit();
        }, 0);
      }

      return newMessage.id;
    },
    [handleSubmit]
  );

  return (
    <div className="h-dvh bg-background relative">
      <div className="h-full w-full">
        <div className="flex flex-col relative h-full">
          <div
            className="flex flex-col pb-2 md:pb-4 transition-all duration-300 h-full justify-center items-center"
          >
            {/* Only show input box - centered vertically */}
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
          </div>
        </div>
      </div>
    </div>
  );
}