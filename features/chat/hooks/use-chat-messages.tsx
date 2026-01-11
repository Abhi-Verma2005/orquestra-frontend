/**
 * useChatMessages Hook
 * 
 * Manages message state and handles WebSocket events for messages
 * Handles text streaming, tool invocations, and message updates
 * 
 * @param params - Message management parameters
 * @returns Object with messages state and setters
 * 
 * @example
 * ```tsx
 * const { messages, setMessages, resetStreamingState } = useChatMessages({
 *   chatId, initialMessages, onEvent, realtimeToolInvocations,
 *   setRightPanelContent, setIsLoading, chatExists, user, isGroupChat,
 *   setIsGroupChat, setIsOwner, id, normalizeContent, lastUserMessageRef
 * });
 * ```
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Message, ToolInvocation } from 'ai';
import { MessageType, type ChatMessage, FunctionName } from '@/contexts/websocket-context';
import { Markdown } from '@/components/chat/Markdown';
import { cleanInitialMessages } from '../utils/message-cleanup';
import { normalizeContent } from '../utils/message-formatters';

interface UseChatMessagesParams {
  chatId: string | null;
  initialMessages: Array<Message>;
  onEvent: (type: MessageType, handler: (payload: unknown) => void) => () => void;
  realtimeToolInvocations: ToolInvocation[];
  currentMessageToolInvocations: ToolInvocation[]; // Tool invocations for current message only
  setRightPanelContent: (content: React.ReactNode) => void;
  setIsLoading: (loading: boolean) => void;
  chatExists: boolean;
  user?: any;
  isGroupChat: boolean;
  setIsGroupChat: (isGroup: boolean) => void;
  setIsOwner: (isOwner: boolean) => void;
  id: string | null;
  lastUserMessageRef: React.MutableRefObject<string | null>;
  cartState?: { items: any[] };
  addItemToCart?: (item: any) => void;
  setCurrentMessageId: (messageId: string) => void; // Set the current message ID for tool invocation tracking
  currentMessageId: string | null; // Current message ID from context (may be set by tool call)
}

export function useChatMessages({
  chatId,
  initialMessages,
  onEvent,
  realtimeToolInvocations,
  currentMessageToolInvocations,
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
  setCurrentMessageId,
  currentMessageId,
}: UseChatMessagesParams) {
  // Clean up initial messages
  const cleanedInitialMessages = useMemo(
    () => cleanInitialMessages(initialMessages),
    [initialMessages]
  );

  const [messages, setMessages] = useState<Array<Message>>(cleanedInitialMessages);

  // Sync: When initial messages change (e.g., on page load), ensure DB state is source of truth
  // This ensures frontend state matches backend state from database
  useEffect(() => {
    if (cleanedInitialMessages.length > 0 && messages.length === cleanedInitialMessages.length) {
      // Messages match - this is likely initial load
      // Extract tool invocations from DB messages to ensure they're the source of truth
      const dbToolInvocations = cleanedInitialMessages
        .flatMap(msg => msg.toolInvocations || [])
        .filter(inv => inv.state === 'result' || inv.state === 'call');

      // If we have tool invocations in DB but not in realtime state, that's fine
      // The realtime state is only for "loading" state which hasn't been saved yet
      // DB state (with 'result' or 'call') takes precedence
      if (dbToolInvocations.length > 0) {
        console.log("[SYNC] Loaded", cleanedInitialMessages.length, "messages with", dbToolInvocations.length, "tool invocations from DB");
      }
    }
  }, [cleanedInitialMessages, messages.length]);
  const currentAssistantMessageIdRef = useRef<string | null>(null);
  const streamingContentRef = useRef<string>("");

  // Helper function to reset streaming state
  const resetStreamingState = useCallback(() => {
    currentAssistantMessageIdRef.current = null;
    streamingContentRef.current = "";
  }, []);

  // Handle WebSocket events
  useEffect(() => {
    // Handle text streaming
    const unsubscribeTextStream = onEvent(
      MessageType.TextStream,
      (payload: unknown) => {
        const chunk = typeof payload === 'string'
          ? payload
          : ((payload as any).content || (payload as any).text || (payload as any).chunk || "");

        if (chunk) {
          setIsLoading(true);

          if (!currentAssistantMessageIdRef.current) {
            // FIRST CHUNK: Create new assistant message
            // Use existing message ID from context if set (e.g., by a prior tool call)
            // Otherwise generate a new one
            const messageId = currentMessageId || `stream_${Date.now()}`;
            currentAssistantMessageIdRef.current = messageId;
            streamingContentRef.current = chunk;

            // Only call setCurrentMessageId if we generated a new ID
            // (if currentMessageId was already set, it's already in context)
            if (!currentMessageId) {
              setCurrentMessageId(messageId);
            }

            setMessages((prev) => [
              ...prev,
              {
                id: messageId,
                role: "assistant",
                content: chunk,
              },
            ]);
          } else {
            // SUBSEQUENT CHUNKS: Update existing message
            const messageId = currentAssistantMessageIdRef.current;
            streamingContentRef.current += chunk;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId ? { ...msg, content: streamingContentRef.current } : msg
              )
            );
          }
        }
      }
    );

    // Handle text stream end
    const unsubscribeTextStreamEnd = onEvent(
      MessageType.TextStreamEnd,
      (payload: unknown) => {
        setIsLoading(false);

        if (currentAssistantMessageIdRef.current) {
          const messageId = currentAssistantMessageIdRef.current;
          const finalContent = typeof payload === 'string'
            ? payload
            : ((payload as any)?.content || (payload as any)?.text || streamingContentRef.current);

          setMessages((prev) => {
            const existingIndex = prev.findIndex(
              (m) => m.id === messageId && m.role === "assistant"
            );

            if (existingIndex >= 0) {
              const updated = [...prev];

              // Use currentMessageToolInvocations which only contains invocations for THIS message
              // This fixes the issue where tool invocations from other messages would leak
              const messageToolInvocations = currentMessageToolInvocations.map((realtimeInv) => {
                return {
                  toolCallId: realtimeInv.id,
                  toolName: realtimeInv.name,
                  args: realtimeInv.args,
                  state: realtimeInv.state === 'complete' ? 'result' as const : 'call' as const,
                  result: realtimeInv.result,
                };
              });

              // Merge with existing tool invocations (avoid duplicates)
              const existingToolInvocations = updated[existingIndex].toolInvocations || [];
              const existingToolCallIds = new Set(existingToolInvocations.map(inv => inv.toolCallId));

              // Only add tool invocations that don't already exist
              const newToolInvocations = messageToolInvocations.filter(
                inv => !existingToolCallIds.has(inv.toolCallId)
              );

              updated[existingIndex] = {
                ...updated[existingIndex],
                content: finalContent,
                toolInvocations: [...existingToolInvocations, ...newToolInvocations],
              };
              return updated;
            }
            return prev;
          });
        }

        // Reset streaming state (always reset, even if no current message)
        resetStreamingState();
      }
    );

    // Handle message received confirmation
    const unsubscribeMessageReceived = onEvent(
      MessageType.MessageReceived,
      (payload: unknown) => {
        const data = payload as { room_id: string; payload: ChatMessage };
        if (data.payload) {
          const userMsg: ChatMessage = data.payload;
          if (userMsg.role === "user") {
            setIsLoading(true);
            // Note: lastUserMessageRef is already set in handleSubmit before sending
          }
        }
      }
    );

    // Handle ChatMessage events (from backend RoomMessage broadcasts)
    const unsubscribeChatMessage = onEvent(
      MessageType.ChatMessage,
      (payload: unknown) => {
        const data = payload as { room_id: string; payload: ChatMessage };

        // CRITICAL: Only process messages if room_id matches current chat id AND chat exists
        // This prevents processing messages for other chats or creating chats from random UUIDs on home page
        if (!data.payload || !data.room_id || data.room_id !== id) {
          return;
        }

        // Additional safety check: Don't process messages if we're on the home page (chat doesn't exist yet)
        // The home page has a random UUID that doesn't correspond to a real chat
        if (!chatExists && messages.length === 0) {
          return;
        }

        const chatMsg: ChatMessage = data.payload;

        // Handle system messages (user joined/left)
        if (chatMsg.role === "system" && chatMsg.content) {
          setIsLoading(false);
          const messageId = `system_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 11)}`;

          // Normalize content to string
          const normalizedContent = normalizeContent(chatMsg.content);

          // If a user joined, reload chat info to update isGroupChat status
          if (normalizedContent.includes("joined the chat") && id && user) {
            fetch(`/api/chat/info?id=${id}`)
              .then((response) => {
                if (response.ok) {
                  return response.json();
                }
              })
              .then((data) => {
                if (data) {
                  setIsGroupChat(data.isGroupChat || false);
                  setIsOwner(data.userId === user?.id);
                }
              })
              .catch((error) => {
                console.error(
                  "Error reloading chat info after user joined:",
                  error
                );
              });
          }

          setMessages((prev) => [
            ...prev,
            {
              id: messageId,
              role: "system",
              content: normalizedContent,
            },
          ]);
          return;
        }

        // Handle user messages (group messages)
        if (chatMsg.role === "user" && chatMsg.content) {
          setIsLoading(false);
          // Use backend ID if available, otherwise generate one
          const messageId = chatMsg.id || `user_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 11)}`;

          // Normalize content to string
          const normalizedContent = normalizeContent(chatMsg.content);

          setMessages((prev) => {
            // Check for duplicates: first by ID (backend source of truth), then by content
            const isDuplicate = prev.some((msg) => {
              // If backend provided an ID, check by ID first (most reliable)
              if (chatMsg.id && msg.id === chatMsg.id) {
                return true;
              }
              // Fallback: check by content and name (for messages without IDs)
              return (
                msg.role === "user" &&
                normalizeContent(msg.content) === normalizedContent &&
                msg.name === chatMsg.name
              );
            });
            if (isDuplicate) {
              return prev;
            }
            return [
              ...prev,
              {
                id: messageId,
                role: "user",
                content: normalizedContent,
                name: chatMsg.name, // Include sender's user_id
              } as Message,
            ];
          });
          return;
        }

        // Only handle assistant messages (user messages are already added via handleSubmit)
        if (chatMsg.role === "assistant" && chatMsg.content) {
          setIsLoading(false);
          // Use backend ID if available, otherwise generate one
          const messageId = chatMsg.id || `assistant_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 11)}`;

          // Normalize content to string
          const normalizedContent = normalizeContent(chatMsg.content);

          setMessages((prev) => {
            // Check for duplicates: first by ID (backend source of truth), then by content
            const isDuplicate = prev.some((msg) => {
              // If backend provided an ID, check by ID first (most reliable)
              if (chatMsg.id && msg.id === chatMsg.id) {
                return true;
              }

              // Fallback: check by content (for messages without IDs)
              if (msg.role !== "assistant" || normalizeContent(msg.content) !== normalizedContent) {
                return false;
              }

              // If no backend ID, check if message was added very recently (within 2 seconds)
              // This prevents rapid duplicates from WebSocket reconnections
              if (!chatMsg.id) {
                try {
                  const msgIdParts = msg.id.split("_");
                  if (msgIdParts.length >= 2) {
                    const msgTime = parseInt(msgIdParts[1] || "0");
                    if (!isNaN(msgTime) && Date.now() - msgTime < 2000) {
                      return true; // Very recent duplicate
                    }
                  }
                } catch {
                  // If parsing fails, still check content match
                }
              }

              return true; // Content matches
            });

            if (isDuplicate) {
              return prev; // Don't add duplicate
            }

            // Before creating/updating a new message, move any realtime tool invocations to the previous assistant message
            const updated = [...prev];
            let lastAssistantIndex = -1;
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === "assistant") {
                lastAssistantIndex = i;
                break;
              }
            }

            // If there's a previous assistant message and we have realtime tool invocations, move them
            if (lastAssistantIndex >= 0 && realtimeToolInvocations.length > 0) {
              const lastAssistant = updated[lastAssistantIndex];
              const existingToolInvocations = lastAssistant.toolInvocations || [];
              const existingToolCallIds = new Set(existingToolInvocations.map(inv => inv.toolCallId));

              // Convert realtimeToolInvocations to message format
              const messageToolInvocations = realtimeToolInvocations
                .filter(realtimeInv => !existingToolCallIds.has(realtimeInv.id))
                .map((realtimeInv) => {
                  return {
                    toolCallId: realtimeInv.id,
                    toolName: realtimeInv.name,
                    args: realtimeInv.args,
                    state: realtimeInv.state === 'complete' ? 'result' as const : 'call' as const,
                    result: realtimeInv.result,
                  };
                });

              if (messageToolInvocations.length > 0) {
                updated[lastAssistantIndex] = {
                  ...lastAssistant,
                  toolInvocations: [...existingToolInvocations, ...messageToolInvocations],
                };
              }
            }

            // Check if we should update the last assistant message or create a new one
            // Look for the last assistant message that either has no content or has tool invocations
            if (lastAssistantIndex >= 0) {
              const lastAssistant = updated[lastAssistantIndex];
              // Update if message has no content OR has tool invocations (to merge acknowledgment with tool results)
              if (
                !lastAssistant.content ||
                (lastAssistant.toolInvocations &&
                  lastAssistant.toolInvocations.length > 0)
              ) {
                // Update existing assistant message, preserving tool invocations
                updated[lastAssistantIndex] = {
                  ...updated[lastAssistantIndex],
                  content: normalizedContent,
                  // Preserve existing tool invocations
                  toolInvocations: updated[lastAssistantIndex].toolInvocations,
                };
                return updated;
              }
            }

            // Create new assistant message if no suitable existing one found
            return [
              ...updated,
              {
                id: messageId,
                role: "assistant",
                content: normalizedContent,
              },
            ];
          });
        }
      }
    );

    // Handle function calls
    const unsubscribeFunctionCall = onEvent(
      MessageType.FunctionCall,
      (payload: unknown) => {
        const data = payload as {
          id?: string;
          name: string;
          args?: Record<string, unknown>;
          params?: Record<string, unknown>;
          requestId?: string;
          role?: string;
        };

        // Handle specific function names
        if (data.name === FunctionName.RenderContent) {
          // Use params (backend sends params, not args)
          const toolParams = data.params || data.args;
          if (!toolParams) {
            return; // No params available yet
          }

          const title = toolParams.title as string | undefined;
          const content = toolParams.content as string | undefined;

          if (!title || !content) {
            return; // Required fields missing
          }

          // No longer automatically opening the right panel.
          // The ToolInvocationCard will handle this when clicked.
        }

        // Add function call as a tool invocation in the last assistant message
        setMessages((prev) => {
          const updated = [...prev];
          // Find the last assistant message or create one
          let lastAssistantIndex = updated.length - 1;
          while (
            lastAssistantIndex >= 0 &&
            updated[lastAssistantIndex].role !== "assistant"
          ) {
            lastAssistantIndex--;
          }

          if (lastAssistantIndex >= 0) {
            // Add tool invocation to existing assistant message
            const message = updated[lastAssistantIndex];

            // Check if this assistant message was created BEFORE the last user message
            // This prevents adding tool calls to old messages
            const messageIndex = updated.findIndex((m) => m.id === message.id);
            const lastUserIndex = lastUserMessageRef.current
              ? updated.findIndex((m) => m.id === lastUserMessageRef.current)
              : -1;

            // Only add to assistant message if it comes AFTER the last user message
            if (lastUserIndex === -1 || messageIndex > lastUserIndex) {
              if (!message.toolInvocations) {
                message.toolInvocations = [];
              }

              // Check if a tool invocation with this name already exists in "call" state
              const existingCall = message.toolInvocations.find(
                (inv) => inv.toolName === data.name && inv.state === "call"
              );

              if (!existingCall) {
                // Only add if we don't already have a "call" state invocation for this tool
                message.toolInvocations.push({
                  toolCallId: `call_${Date.now()}`,
                  toolName: data.name,
                  args: data.args,
                  state: "call",
                });

                const updatedMessage = {
                  ...message,
                  toolInvocations: [...message.toolInvocations],
                };
                updated[lastAssistantIndex] = updatedMessage;
              }
            } else {
              // Create a new assistant message instead
              const newMessage: Message = {
                id: `assistant_${Date.now()}`,
                role: "assistant",
                content: "",
                toolInvocations: [
                  {
                    toolCallId: `call_${Date.now()}`,
                    toolName: data.name,
                    args: data.args,
                    state: "call",
                  },
                ],
              };
              updated.push(newMessage);
            }
          } else {
            // Create a new assistant message with tool invocation
            const newMessage: Message = {
              id: `assistant_${Date.now()}`,
              role: "assistant",
              content: "",
              toolInvocations: [
                {
                  toolCallId: `call_${Date.now()}`,
                  toolName: data.name,
                  args: data.args,
                  state: "call",
                },
              ],
            };
            updated.push(newMessage);
          }
          return updated;
        });
      }
    );

    // Handle function results
    const unsubscribeFunctionResult = onEvent(
      MessageType.FunctionResult,
      (payload: unknown) => {
        const data = payload as {
          name: string;
          result: unknown;
          role?: string;
        };

        // Skip browsePublishers - it's handled by PublishersData event
        if (data.name === "browsePublishers") {
          return;
        }

        // Update ALL tool invocations with this name to result state (in case there are duplicates)
        setMessages((prev) => {
          const updated = [...prev];
          // Find all messages with tool invocations matching this function name
          for (let i = updated.length - 1; i >= 0; i--) {
            const message = updated[i];
            if (message.toolInvocations && message.toolInvocations.length > 0) {
              // Find ALL matching tool invocations in "call" state
              const toolIndices = message.toolInvocations
                .map((inv, idx) =>
                  inv.toolName === data.name && inv.state === "call" ? idx : -1
                )
                .filter((idx) => idx !== -1);

              if (toolIndices.length > 0) {
                const newToolInvocations = [...message.toolInvocations];
                // Update all "call" state invocations to "result"
                toolIndices.forEach((idx) => {
                  newToolInvocations[idx] = {
                    ...newToolInvocations[idx],
                    state: "result",
                    result: data.result,
                  };
                });
                const updatedMessage = {
                  ...updated[i],
                  toolInvocations: newToolInvocations,
                };
                updated[i] = updatedMessage;
              }
            }
          }
          return updated;
        });
      }
    );

    // Handle publishers data
    const unsubscribePublishersData = onEvent(
      MessageType.PublishersData,
      (payload: unknown) => {
        const data = payload as {
          publishers: unknown[];
          totalCount: number;
          filters?: unknown;
        };

        // Safety check
        if (!data.publishers || !Array.isArray(data.publishers)) {
          console.error("[Chat] Invalid publishers data received:", data);
          return;
        }

        // Transform backend format to frontend format (with metadata)
        const transformedData = (() => {
          const publishers = (data.publishers || []) as Array<{
            authority?: { dr?: number; da?: number };
            pricing?: { base?: number; withContent?: number };
            niche?: string[];
          }>;

          // Calculate metadata from publishers
          const totalCount = data.totalCount || publishers.length;
          const drValues = publishers
            .map((p) => p.authority?.dr)
            .filter((dr): dr is number => typeof dr === "number");
          const daValues = publishers
            .map((p) => p.authority?.da)
            .filter((da): da is number => typeof da === "number");
          const prices = publishers
            .flatMap((p) => [p.pricing?.base, p.pricing?.withContent])
            .filter((price): price is number => typeof price === "number");

          const averageDR =
            drValues.length > 0
              ? Math.round(
                drValues.reduce((sum, dr) => sum + dr, 0) / drValues.length
              )
              : 0;
          const averageDA =
            daValues.length > 0
              ? Math.round(
                daValues.reduce((sum, da) => sum + da, 0) / daValues.length
              )
              : 0;
          const priceRange =
            prices.length > 0
              ? { min: Math.min(...prices), max: Math.max(...prices) }
              : { min: 0, max: 0 };

          // Get top niches
          const nicheCounts = new Map<string, number>();
          publishers.forEach((p) => {
            p.niche?.forEach((niche) => {
              nicheCounts.set(niche, (nicheCounts.get(niche) || 0) + 1);
            });
          });
          const topNiches = Array.from(nicheCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([niche]) => niche);

          return {
            publishers: data.publishers,
            metadata: {
              totalCount,
              averageDR,
              averageDA,
              priceRange,
              topNiches,
              summary: `Found ${totalCount} publishers matching your criteria`,
            },
            filters: data.filters || {},
          };
        })();

        // Update ALL browsePublishers tool invocations to result state
        setMessages((prev) => {
          const updated = [...prev];
          // Find all messages with tool invocations (browsePublishers)
          for (let i = updated.length - 1; i >= 0; i--) {
            const message = updated[i];
            if (message.toolInvocations && message.toolInvocations.length > 0) {
              // Find ALL browsePublishers tool invocations (in case there are duplicates)
              const browseToolIndices = message.toolInvocations
                .map((inv, idx) =>
                  inv.toolName === "browsePublishers" && inv.state === "call"
                    ? idx
                    : -1
                )
                .filter((idx) => idx !== -1);

              if (browseToolIndices.length > 0) {
                const newToolInvocations = [...(message.toolInvocations || [])];
                // Update all "call" state browsePublishers invocations to "result"
                browseToolIndices.forEach((idx) => {
                  newToolInvocations[idx] = {
                    ...newToolInvocations[idx],
                    state: "result",
                    result: transformedData,
                  };
                });
                const updatedMessage = {
                  ...updated[i],
                  toolInvocations: newToolInvocations,
                };
                updated[i] = updatedMessage;
              }
            }
          }
          return updated;
        });
      }
    );

    // Handle cart data
    const unsubscribeCartData = onEvent(
      MessageType.CartData,
      (payload: unknown) => {
        const data = payload as {
          action: "show" | "checkout";
          summary?: {
            totalItems: number;
            totalQuantity: number;
            totalPrice: number;
            isEmpty: boolean;
          };
          cartData?: {
            items: unknown[];
            totalItems: number;
            totalPrice: number;
          };
          message?: string;
        };

        // Update viewCart tool invocations to result state
        if (data.summary) {
          const cartSummary = {
            summary: data.summary,
            cartData: data.cartData || {
              items: [],
              totalItems: data.summary.totalItems,
              totalPrice: data.summary.totalPrice,
            },
            success: true,
            message:
              data.message ||
              (data.summary.isEmpty ? "Cart is empty" : "Cart displayed"),
          };

          setMessages((prev) => {
            const updated = [...prev];
            // Find all messages with tool invocations (viewCart)
            for (let i = updated.length - 1; i >= 0; i--) {
              const message = updated[i];
              if (
                message.toolInvocations &&
                message.toolInvocations.length > 0
              ) {
                // Find ALL viewCart tool invocations (in case there are duplicates)
                const viewCartIndices = message.toolInvocations
                  .map((inv, idx) =>
                    inv.toolName === "viewCart" && inv.state === "call"
                      ? idx
                      : -1
                  )
                  .filter((idx) => idx !== -1);

                if (viewCartIndices.length > 0) {
                  const newToolInvocations = [
                    ...(message.toolInvocations || []),
                  ];
                  // Update all "call" state viewCart invocations to "result"
                  viewCartIndices.forEach((idx) => {
                    newToolInvocations[idx] = {
                      ...newToolInvocations[idx],
                      state: "result",
                      result: cartSummary,
                    };
                  });
                  const updatedMessage = {
                    ...updated[i],
                    toolInvocations: newToolInvocations,
                  };
                  updated[i] = updatedMessage;
                }
              }
            }
            return updated;
          });
        }

        if (data.action === "show" && cartState) {
          // Show cart in sidebar
          import("@/components/oms/cart-management-results").then(
            ({ default: CartManagementResults }) => {
              const items = cartState.items || [];
              const cartData = {
                items: items,
                totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
                totalPrice: items.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                ),
                lastUpdated: new Date(),
              };

              setRightPanelContent(
                <CartManagementResults
                  data={{
                    success: true,
                    message: data.message || "Your cart",
                    cartData,
                  }}
                  onDoneAddingToCart={() => {
                    // Cart management complete
                  }}
                />
              );
            }
          );
        }
      }
    );

    // Handle cart updated - add item to cart
    const unsubscribeCartUpdated = onEvent(
      MessageType.CartUpdated,
      (payload: unknown) => {
        const data = payload as {
          action: "add";
          item: {
            type: "publisher" | "product";
            name: string;
            price: number;
            quantity: number;
            metadata?: unknown;
          };
        };

        if (data.action === "add" && data.item && addItemToCart) {
          // Generate a cart ID for the item
          const cartId = `cart_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          addItemToCart({
            id: cartId,
            type: data.item.type,
            name: data.item.name,
            price: data.item.price,
            quantity: data.item.quantity,
            addedAt: new Date(),
            metadata: data.item.metadata as {
              publisherId?: string;
              website?: string;
              niche?: string[];
              dr?: number;
              da?: number;
            },
          });
        }
      }
    );

    // Handle errors
    const unsubscribeError = onEvent(MessageType.Error, (payload: unknown) => {
      const data = payload as { error: string };
      console.error("[Chat] WebSocket error:", data.error);
      setIsLoading(false);
    });

    return () => {
      unsubscribeTextStream();
      unsubscribeTextStreamEnd();
      unsubscribeMessageReceived();
      unsubscribeChatMessage();
      unsubscribeFunctionCall();
      unsubscribeFunctionResult();
      unsubscribePublishersData();
      unsubscribeCartData();
      unsubscribeCartUpdated();
      unsubscribeError();
    };
  }, [
    onEvent,
    id,
    user,
    setRightPanelContent,
    setMessages,
    chatExists,
    resetStreamingState,
    realtimeToolInvocations,
    currentMessageToolInvocations,
    setCurrentMessageId,
    currentMessageId,
    setIsLoading,
    isGroupChat,
    setIsGroupChat,
    setIsOwner,
    lastUserMessageRef,
    cartState,
    addItemToCart,
  ]);

  return { messages, setMessages, resetStreamingState };
}
