/**
 * useChatDrafts Hook
 * 
 * Manages draft persistence logic for chat input (localStorage)
 * Handles per-chat and new-chat drafts with debounced saving
 * 
 * @param chatId - Current chat ID (null for new chat)
 * @param messagesLength - Number of messages (to determine draft key)
 * @returns Object with input state and setter
 * 
 * @example
 * ```tsx
 * const { input, setInput } = useChatDrafts(chatId, messages.length);
 * ```
 */

'use client';

import { useState, useEffect, useRef } from 'react';

import { getPerChatDraftKey, NEW_CHAT_DRAFT_KEY } from '../utils/draft-storage';

export function useChatDrafts(chatId: string | null, messagesLength: number) {
  const [input, setInput] = useState("");
  const saveDraftTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Restore draft from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && chatId) {
      try {
        const key =
          messagesLength === 0 ? NEW_CHAT_DRAFT_KEY : getPerChatDraftKey(chatId);
        const saved = localStorage.getItem(key);
        if (typeof saved === "string") {
          setInput(saved);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [chatId, messagesLength]);

  // Save draft to localStorage whenever input changes (debounced)
  useEffect(() => {
    if (typeof window !== "undefined" && chatId) {
      // Clear previous timeout
      if (saveDraftTimeoutRef.current) {
        clearTimeout(saveDraftTimeoutRef.current);
      }
      // Save after 300ms of no typing
      saveDraftTimeoutRef.current = setTimeout(() => {
        try {
          const key =
            messagesLength === 0 ? NEW_CHAT_DRAFT_KEY : getPerChatDraftKey(chatId);
          if (input.trim()) {
            localStorage.setItem(key, input);
          } else {
            // Clear if empty
            localStorage.removeItem(key);
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
  }, [input, chatId, messagesLength]);

  return { input, setInput };
}
