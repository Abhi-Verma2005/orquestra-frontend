/**
 * useChatSubmission Hook
 * 
 * Handles form submission logic, message routing (AI vs group chat), and chat creation
 * 
 * @param params - Submission parameters
 * @returns Object with submission handler and creation state
 * 
 * @example
 * ```tsx
 * const { handleSubmit, isCreatingChat } = useChatSubmission({
 *   input, isLoading, id, user, messages, isGroupChat,
 *   sendMessage, router, setMessages, setInput, setIsLoading,
 *   scrollToMessage, resetStreamingState, setIsGroupChat, setIsOwner,
 *   setChatExists, stopRequestedRef, lastUserMessageRef, cartState
 * });
 * ```
 */

'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useState } from 'react';

import { useAgents } from './use-agents';
import { getPerChatDraftKey, NEW_CHAT_DRAFT_KEY } from '../utils/draft-storage';

import type { ChatMessage } from '@/contexts/websocket-context';
import type { Message } from 'ai';

import { getBackendUrl } from '@/lib/utils';


interface UseChatSubmissionParams {
  input: string;
  isLoading: boolean;
  id: string | null;
  user?: any;
  messages: Message[];
  isGroupChat: boolean;
  sendMessage: (payload: any) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInput: (input: string) => void;
  setIsLoading: (loading: boolean) => void;
  scrollToMessage: (messageId: string) => void;
  resetStreamingState: () => void;
  resetUIState: () => void;
  setIsGroupChat: (isGroup: boolean) => void;
  setIsOwner: (isOwner: boolean) => void;
  setChatExists: (exists: boolean) => void;
  stopRequestedRef: React.MutableRefObject<boolean>;
  lastUserMessageRef: React.MutableRefObject<string | null>;
  cartState: { items: any[] };
  selectedAgent: { id: string; name: string; description?: string } | null;
}

export function useChatSubmission({
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
  selectedAgent,
}: UseChatSubmissionParams) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const { agents } = useAgents();

  const handleSubmit = useCallback(
    async (event?: { preventDefault?: () => void }) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }

      // Always allow the first message to create a chat, even if WebSocket
      // connection hasn't finished establishing yet. We'll defer the actual
      // WebSocket send to the pending-first-message handler on the new chat page.
      if (!input.trim() || isLoading) {
        return;
      }

      // Check if message starts with "@ai" (case-insensitive)
      const trimmedInput = input.trim();
      const hasAiPrefix = trimmedInput.toLowerCase().startsWith("@ai");

      // Reload chat info to ensure we have the latest isGroupChat status
      // This is important because the chat might have become a group chat after someone joined
      let currentIsGroupChat = isGroupChat;
      if (id && user && !hasAiPrefix) {
        try {
          const backendUrl = getBackendUrl();
          const response = await fetch(`${backendUrl}/api/chat/info?id=${id}`, {
            headers: {
              Authorization: (session as any)?.accessToken ? `Bearer ${(session as any).accessToken}` : "",
            },
          });
          if (response.ok) {
            const data = await response.json();
            currentIsGroupChat = data.isGroupChat || false;
            setIsGroupChat(currentIsGroupChat);
            setIsOwner(data.userId === user?.id);
          }
        } catch (error) {
          console.error(
            "Error reloading chat info before sending message:",
            error
          );
        }
      }

      // Message routing logic:
      // - If NOT group chat: all messages go to AI (existing behavior)
      // - If IS group chat: check for "@ai" prefix
      const isAiMessage = !currentIsGroupChat || hasAiPrefix;

      const userMessage: ChatMessage = {
        role: "user",
        content: trimmedInput,
      };

      // Add user message to state
      const userMsgId = `user_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 11)}`;
      lastUserMessageRef.current = userMsgId;
      const userMsg: Message = {
        id: userMsgId,
        role: "user",
        content: userMessage.content,
      };

      // If first message in a new chat: create chat, redirect, then stream
      if (messages.length === 0) {
        try {
          setIsCreatingChat(true);
          const backendUrl = getBackendUrl();

          // Debug logging
          console.log("[DEBUG] Session state:", session);
          console.log("[DEBUG] Access token:", (session as any)?.accessToken);
          const authHeader = (session as any)?.accessToken ? `Bearer ${(session as any).accessToken}` : "";
          console.log("[DEBUG] Authorization header:", authHeader);

          const res = await fetch(`${backendUrl}/api/chat/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
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

          // Chat was created, mark it as existing
          setChatExists(true);

          // Prepare cart data and selected documents to store with pending message
          try {
            // Store pending message with selected agent
            const pendingData = {
              message: userMsg,
              agent_id: selectedAgent?.id,
            };
            sessionStorage.setItem(
              `pending_first_message_${newId}`,
              JSON.stringify(pendingData)
            );
            localStorage.removeItem(NEW_CHAT_DRAFT_KEY);
          } catch { }

          setIsLoading(true);
          stopRequestedRef.current = false;
          router.push(`/chat/${newId}`);
          return;
        } catch (e) {
          console.error("[Chat] Exception creating chat:", e);
          setIsCreatingChat(false);
          return;
        }
      }

      let context: Message[] = [...messages];

      // Existing chat: proceed normally
      // For group chats, don't add message locally - wait for broadcast to ensure consistent ordering
      // For non-group chats, add immediately (existing behavior)
      if (!isGroupChat) {
        setMessages((prev) => [...prev, userMsg]);
        context.push(userMsg);
        // Scroll so the just-sent user message is positioned at the top of the scroll container
        setTimeout(() => {
          scrollToMessage(`msg-${userMsgId}`);
        }, 0);
      } else {
        // For group chats: add message locally immediately for instant feedback
        // When broadcast comes back, deduplication will prevent duplicate
        // Use a consistent message structure with sender info
        const groupUserMsg: Message = {
          ...userMsg,
          name: user?.id, // Include sender's user_id for group messages
        };
        setMessages((prev) => [...prev, groupUserMsg]);
        context.push(groupUserMsg);
        setTimeout(() => {
          scrollToMessage(`msg-${userMsgId}`);
        }, 0);

        // Store a reference to this message so we can update it if needed when broadcast arrives
        // This helps with consistent ordering
        lastUserMessageRef.current = userMsgId;
      }

      // Reset streaming state and UI state before sending new message (defensive cleanup)
      resetStreamingState();
      resetUIState(); // Clear tool invocations from previous message

      sendMessage({
        chat_id: id!,
        user_id: user?.id,
        message: {
          room_id: id!,
          payload: {
            ...userMessage,
          },
        },
        chat_array: context,
        is_ai_message: isAiMessage, // true if: not group chat OR has "@ai" prefix
        is_group_chat: currentIsGroupChat, // Tell backend if this is a group chat (use latest value)
        agent_id: selectedAgent?.id, // Use the persistent selected agent
      });

      setInput("");
      setIsLoading(true);
      stopRequestedRef.current = false;
      if (typeof window !== "undefined" && id) {
        try {
          localStorage.removeItem(NEW_CHAT_DRAFT_KEY);
          localStorage.removeItem(getPerChatDraftKey(id));
        } catch { }
      }
    },
    [
      input,
      isLoading,
      id,
      sendMessage,
      scrollToMessage,
      user,
      messages.length,
      router,
      cartState.items,
      isGroupChat,
      resetStreamingState,
      resetUIState,
      setMessages,
      setInput,
      setIsLoading,
      setIsGroupChat,
      setIsOwner,
      setChatExists,
      stopRequestedRef,
      lastUserMessageRef,
      session,
      selectedAgent,
    ]
  );

  return { handleSubmit, isCreatingChat };
}
