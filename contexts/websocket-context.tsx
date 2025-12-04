"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

// WebSocket message types matching backend protocol
export enum MessageType {
  ConnectionEstablished = "connection_established",
  ConnectionError = "connection_error",
  JoinChat = "join_chat",
  LeaveChat = "leave_chat",
  ChatMessage = "chat_message",
  MessageReceived = "message_received",
  MessageError = "message_error",
  TextStream = "text_stream",
  TextStreamEnd = "text_stream_end",
  FunctionCall = "function_call",
  FunctionCallStart = "function_call_start",
  FunctionCallEnd = "function_call_end",
  FunctionResult = "function_result",
  FunctionError = "function_error",
  FunctionExecuteRequest = "function_execute_request",
  FunctionExecuteResponse = "function_execute_response",
  PublishersData = "publishers_data",
  CartData = "cart_data",
  ExecutionPlanData = "execution_plan_data",
  PlanCreated = "plan_created",
  PlanUpdated = "plan_updated",
  PlanCompleted = "plan_completed",
  CartUpdated = "cart_updated",
  CartCleared = "cart_cleared",
  SystemMessage = "system_message",
  IterationStart = "iteration_start",
  IterationEnd = "iteration_end",
  Heartbeat = "heartbeat",
  Error = "error",
  StopGeneration = "stop_generation",
  UserMessage = "user_message",
  UserJoined = "user_joined",
  UserLeft = "user_left",
  OpenSidebar = "open_sidebar",
  WalletData = "wallet_data",
  IntentDetected = "intent_detected",
}

export interface WebSocketMessage {
  type: MessageType;
  payload: unknown;
  timestamp: number;
  message_id: string;
}

export interface JoinRoomMessage {
  chat_id: string;
  user_id?: string;
  user_name?: string; // User's name or email for display
}

export interface UserJoinedPayload {
  user_id: string;
  chat_id: string;
}

export interface UserLeftPayload {
  user_id: string;
  chat_id: string;
}

export interface SendMessageData {
  chat_id: string;
  user_id?: string;
  message: {
    room_id: string;
    payload: {
      role: "user" | "assistant" | "system" | "function";
      content: string;
      name?: string;
      // Also embed wallet addresses in the payload for robustness/debugging.
      wallet_addresses?: {
        solana: string | null;
        ethereum: string | null;
      };
    };
  };
  is_ai_message?: boolean; // Optional hint from frontend, backend will verify
  is_group_chat?: boolean; // Tell backend if this is a group chat
  // Top-level wallet addresses so the backend can easily persist them per-connection.
  wallet_addresses?: {
    solana: string | null;
    ethereum: string | null;
  };
}

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "function";
  content: string;
  name?: string;
}

type WebSocketState = "connecting" | "connected" | "disconnected" | "error";

interface WebSocketContextType {
  state: WebSocketState;
  sendMessage: (data: SendMessageData) => void;
  sendStop: (chatId: string) => void;
  joinChat: (chatId: string, userId?: string, userName?: string) => void;
  leaveChat: (chatId: string) => void;
  onMessage: (handler: (message: WebSocketMessage) => void) => () => void;
  onEvent: (eventType: MessageType, handler: (payload: unknown) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Helper for readyState names (used in logging)
const readyStateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

// WebSocket URL for chat WebSocket server (port 8080, root path)
// Format: ws://host:port/ or wss://host:port/ for production
const WS_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL || "ws://localhost:8080/";
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WebSocketState>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageHandlersRef = useRef<Set<(message: WebSocketMessage) => void>>(new Set());
  const eventHandlersRef = useRef<Map<MessageType, Set<(payload: unknown) => void>>>(new Map());
  const currentChatIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    const currentReadyState = wsRef.current?.readyState;

    if (currentReadyState === WebSocket.OPEN) {
      return;
    }

    setState("connecting");

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setState("connected");
        reconnectAttemptsRef.current = 0;

        // Rejoin current chat if there was one
        if (currentChatIdRef.current && ws.readyState === WebSocket.OPEN) {
          const message: WebSocketMessage = {
            type: MessageType.JoinChat,
            payload: { chat_id: currentChatIdRef.current, user_id: currentUserIdRef.current || undefined },
            timestamp: Date.now(),
            message_id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          };
          ws.send(JSON.stringify(message));
        }
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          
          // Check if it's a RoomMessage format (from backend broadcast)
          if (parsed.room_id && parsed.payload && !parsed.type) {
            // Convert RoomMessage to ChatMessage event
            const chatMessage = parsed.payload as ChatMessage;
            
            // Emit as ChatMessage event
            const eventHandlers = eventHandlersRef.current.get(MessageType.ChatMessage);
            
            if (eventHandlers) {
              eventHandlers.forEach((handler) => {
                try {
                  handler({ room_id: parsed.room_id, payload: chatMessage });
                } catch (error) {
                  console.error("[WebSocket] Error in ChatMessage handler:", error);
                }
              });
            }
            return;
          }
          
          // Otherwise, treat as WebSocketMessage
          if (!parsed.type) {
            return;
          }
          
          const message: WebSocketMessage = parsed;

          // Notify all message handlers
          messageHandlersRef.current.forEach((handler) => {
            try {
              handler(message);
            } catch (error) {
              console.error("[WebSocket] Error in general message handler:", error);
            }
          });

          // Notify event-specific handlers
          const eventHandlers = eventHandlersRef.current.get(message.type);
          if (eventHandlers) {
            eventHandlers.forEach((handler) => {
              try {
                handler(message.payload);
              } catch (error) {
                console.error("[WebSocket] Error in event handler:", error);
              }
            });
          }
        } catch (error) {
          console.error('❌ [WebSocket] Error parsing message:', error, event.data);
        }
      };

      ws.onerror = (error) => {
        // Check for common error scenarios
        if (WS_URL.startsWith('ws://') && window.location.protocol === 'https:') {
          console.error('[WebSocket] SECURITY ISSUE: Trying to use ws:// (insecure) on https:// page. Use wss:// instead!');
        }
        
        if (!WS_URL.includes('://')) {
          console.error('[WebSocket] INVALID URL: Missing protocol (ws:// or wss://)');
        }
        
        setState("error");
      };

      ws.onclose = (event) => {
        if (event.code === 1006) {
          console.error('[WebSocket] Abnormal closure (1006) - Network connection lost or server unreachable');
        }
        
        if (!event.wasClean) {
          console.error('[WebSocket] Connection was NOT cleanly closed - indicates an error');
        }
        
        setState("disconnected");
        wsRef.current = null;

        // Attempt reconnect if needed
        if (shouldReconnectRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          const delay = RECONNECT_DELAY * reconnectAttemptsRef.current;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error('[WebSocket] Max reconnect attempts reached. Stopping reconnection.');
          setState("error");
        }
      };
    } catch (error) {
      console.error('[WebSocket] Exception during connection:', error instanceof Error ? error.message : String(error));
      setState("error");
    }
  }, []);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState("disconnected");
  }, []);

  const sendMessage = useCallback((data: SendMessageData) => {
    const ws = wsRef.current;
    const readyState = ws?.readyState;
    const readyStateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

    if (!ws || readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot send message - WebSocket not open');
      return;
    }

    const message: WebSocketMessage = {
      type: MessageType.ChatMessage,
      payload: { ...data, user_id: data.user_id || currentUserIdRef.current || undefined },
      timestamp: Date.now(),
      message_id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    };

    ws.send(JSON.stringify(message));
  }, [state]);

  const sendStop = useCallback((chatId: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const stopMessage: WebSocketMessage = {
      type: MessageType.StopGeneration,
      payload: { chat_id: chatId },
      timestamp: Date.now(),
      message_id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    } as any;
    ws.send(JSON.stringify(stopMessage));
  }, []);

  const joinChat = useCallback((chatId: string, userId?: string, userName?: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      // Store chatId to join after connection
      currentChatIdRef.current = chatId;
      currentUserIdRef.current = userId || null;
      return;
    }

    const message: WebSocketMessage = {
      type: MessageType.JoinChat,
      payload: { chat_id: chatId, user_id: userId, user_name: userName },
      timestamp: Date.now(),
      message_id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    };

    wsRef.current.send(JSON.stringify(message));
    currentChatIdRef.current = chatId;
    currentUserIdRef.current = userId || null;
  }, []);

  const leaveChat = useCallback((chatId: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: WebSocketMessage = {
      type: MessageType.LeaveChat,
      payload: { chat_id: chatId },
      timestamp: Date.now(),
      message_id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    };

    wsRef.current.send(JSON.stringify(message));
    if (currentChatIdRef.current === chatId) {
      currentChatIdRef.current = null;
    }
  }, []);

  const onMessage = useCallback((handler: (message: WebSocketMessage) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  const onEvent = useCallback((eventType: MessageType, handler: (payload: unknown) => void) => {
    if (!eventHandlersRef.current.has(eventType)) {
      eventHandlersRef.current.set(eventType, new Set());
    }
    eventHandlersRef.current.get(eventType)!.add(handler);
    
    return () => {
      const handlers = eventHandlersRef.current.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const value: WebSocketContextType = {
    state,
    sendMessage,
    sendStop,
    joinChat,
    leaveChat,
    onMessage,
    onEvent,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
}

