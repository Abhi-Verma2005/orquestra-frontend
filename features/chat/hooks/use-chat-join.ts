/**
 * useChatJoin Hook
 * 
 * Manages chat join/leave logic, chat info loading, and pending first message handling
 * 
 * @param chatId - Current chat ID
 * @param user - Current user object
 * @param wsState - WebSocket connection state
 * @param joinChat - Function to join a chat room
 * @param sendMessage - Function to send a message
 * @param setMessages - Function to update messages state
 * @param setIsLoading - Function to set loading state
 * @param scrollToMessage - Function to scroll to a message
 * @param setChatExists - Function to set chat existence state
 * @param setIsGroupChat - Function to set group chat state
 * @param setIsOwner - Function to set owner state
 * @param userInfo - User info from context
 * @returns Object with chat info state
 * 
 * @example
 * ```tsx
 * const { isGroupChat, isOwner, chatExists } = useChatJoin(
 *   chatId, user, wsState, joinChat, sendMessage, setMessages, setIsLoading, scrollToMessage,
 *   setChatExists, setIsGroupChat, setIsOwner, userInfo
 * );
 * ```
 */

'use client';

import { useEffect, useRef } from 'react';

import { NEW_CHAT_DRAFT_KEY } from '../utils/draft-storage';

import type { Message } from 'ai';

interface UseChatJoinParams {
  chatId: string | null;
  user?: any;
  wsState: string;
  joinChat: (chatId: string, userId?: string, userName?: string) => void;
  sendMessage: (payload: any) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsLoading: (loading: boolean) => void;
  scrollToMessage: (messageId: string) => void;
  setChatExists: (exists: boolean) => void;
  setIsGroupChat: (isGroup: boolean) => void;
  setIsOwner: (isOwner: boolean) => void;
  userInfo?: { name?: string; email?: string };
  stopRequestedRef: React.MutableRefObject<boolean>;
  setSelectedAgent?: (agent: { id: string; name: string; description?: string } | null) => void;
}

export function useChatJoin({
  chatId,
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
  userInfo,
  stopRequestedRef,
  setSelectedAgent,
}: UseChatJoinParams) {
  const lastJoinedChatIdRef = useRef<string | null>(null);

  // Load chat info and check if group chat
  useEffect(() => {
    const loadChatInfo = async () => {
      try {
        const response = await fetch(`/api/chat/info?id=${chatId}`);
        if (response.ok) {
          const data = await response.json();
          setIsGroupChat(data.isGroupChat || false);
          setIsOwner(data.userId === user?.id);
          setChatExists(true); // Chat exists in database
        } else {
          // If API fails (404), chat doesn't exist yet (e.g., home page with random UUID)
          setIsGroupChat(false);
          setIsOwner(false);
          setChatExists(false);
        }
      } catch (error) {
        console.error("Error loading chat info:", error);
        // On error, assume chat doesn't exist
        setIsGroupChat(false);
        setIsOwner(false);
        setChatExists(false);
      }
    };
    if (chatId && user) {
      loadChatInfo();
    } else {
      setChatExists(false);
    }
  }, [chatId, user, setChatExists, setIsGroupChat, setIsOwner]);

  // Join chat on mount - only if chat exists
  useEffect(() => {
    // We assume if ID is provided, the chat exists (or we should try to join it).
    // The previous check for chatExists caused a race condition.
    const shouldJoin = !!chatId;

    // If not connected, reset the ref so we can join again when connected
    if (wsState !== "connected") {
      lastJoinedChatIdRef.current = null;
      return;
    }

    // Only join if we haven't already joined this chat
    if (
      shouldJoin &&
      chatId &&
      lastJoinedChatIdRef.current !== chatId
    ) {
      const userName =
        userInfo?.name ||
        userInfo?.email ||
        user?.email ||
        user?.name ||
        undefined;
      joinChat(chatId, user?.id, userName);
      lastJoinedChatIdRef.current = chatId;
    }
  }, [
    chatId,
    wsState,
    joinChat,
    user?.id,
    userInfo?.name,
    userInfo?.email,
    user?.email,
    user?.name,
  ]);

  // If we navigated after creating a new chat, pick up the pending first message and send it
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (wsState !== "connected" || !chatId) return;
    try {
      const key = `pending_first_message_${chatId}`;
      const raw = sessionStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      // Handle both old format (just Message) and new format (with cartData)
      let pending: Message;

      if (parsed.message) {
        // New format: { message: Message, cartData?: any, selectedAgent?: any }
        pending = parsed.message;
        setMessages((prev) => [...prev, parsed.message])

        // Restore selected agent if present
        if (parsed.selectedAgent && setSelectedAgent) {
          setSelectedAgent(parsed.selectedAgent);
        }
      } else {
        // Old format: just Message
        pending = parsed as Message;
        setMessages((prev) => [...prev, parsed])
      }
      // Send via WebSocket; UI likely already shows this message from DB
      if (pending?.content) {
        const messagePayload: any = {
          chat_id: chatId,
          user_id: user?.id,
          agent_id: parsed.agent_id, // Pass the tagged agent ID if present
          message: {
            room_id: chatId,
            payload: {
              role: "user",
              content: pending.content,
            },
          },
        };

        sendMessage(messagePayload);
        setIsLoading(true);
        stopRequestedRef.current = false;

        // Align the pending message to top in the viewport
        setTimeout(() => {
          scrollToMessage(`msg-${pending.id}`);
        }, 0);
      }
      sessionStorage.removeItem(key);
      // Clear any leftover new-chat draft
      localStorage.removeItem(NEW_CHAT_DRAFT_KEY);
    } catch { }
  }, [chatId, wsState, sendMessage, scrollToMessage, user, setMessages, setIsLoading, stopRequestedRef]);
}
