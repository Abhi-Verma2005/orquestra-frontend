"use client";

import { Message } from "ai";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

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
  IntentDetected = "intent_detected",
  LlmThought = "llm_thought",
  LlmAction = "llm_action",
  ProgressUpdate = "progress_update",
  UiStateChange = "ui_state_change",
}

export enum FunctionName {
  RenderContent = "render_content",
  GetUserInfo = "get_user_info",
}

export interface FunctionCallStartPayload {
  name: FunctionName;
}

export interface FunctionCallEndPayload {
  name: FunctionName;
  tool_id?: string;
  tool_result: string;
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
      role: "user" | "assistant" | "system" | "function" | "tool";
      content: string;
      name?: string;
      tool_calls?: any[];
      tool_call_id?: string;
    };
  };
  chat_array?: Message[];
  is_ai_message?: boolean; // Optional hint from frontend, backend will verify
  is_group_chat?: boolean; // Tell backend if this is a group chat
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system" | "function" | "tool";
  content: string;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
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
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Helper for readyState names (used in logging)
const readyStateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

// WebSocket URL for chat WebSocket server
// Format: ws://host:port/ws or wss://host:port/ws for production
const WS_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL || "ws://localhost:8000/ws";
const RECONNECT_DELAY = 1000;
const MAX_RECONNECT_ATTEMPTS = 0; // Disable automatic retries in background

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
  const toastIdRef = useRef<string | number | null>(null);

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
        // Keep as warnings for debugging, but don't use console.error which can be caught by error boundaries/crash reports
        if (WS_URL.startsWith('ws://') && window.location.protocol === 'https:') {
          console.warn('[WebSocket] SECURITY ISSUE: Trying to use ws:// (insecure) on https:// page. Use wss:// instead!');
        }

        if (!WS_URL.includes('://')) {
          console.warn('[WebSocket] INVALID URL: Missing protocol (ws:// or wss://)');
        }

        setState("error");
      };

      ws.onclose = (event) => {
        wsRef.current = null;

        // If it wasn't a clean close, or it was an abnormal closure, show the error toast
        if (!event.wasClean || event.code === 1006) {
          setState("error");
        } else {
          setState("disconnected");
        }
      };
    } catch (error) {
      // Silent fail here as the 'error' state will handle the UI
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
      console.warn('[WebSocket] Cannot send message - WebSocket not open');
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

  // Handle error state with a toast
  useEffect(() => {
    if (state === "error") {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }

      toastIdRef.current = toast.error("Connection lost", {
        description: "WebSocket connection failed. Would you like to try reconnecting?",
        duration: Infinity,
        action: {
          label: "Try Reconnect",
          onClick: () => {
            reconnectAttemptsRef.current = 0;
            shouldReconnectRef.current = true;
            connect();
          },
        },
      });
    } else if (state === "connected") {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }

      toast.success("Connected", {
        description: "WebSocket connection established.",
        duration: 3000,
      });
    }

    return () => {
      if (toastIdRef.current && state !== "error") {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, [state, connect]);

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
    reconnect: () => {
      reconnectAttemptsRef.current = 0;
      shouldReconnectRef.current = true;
      connect();
    },
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

