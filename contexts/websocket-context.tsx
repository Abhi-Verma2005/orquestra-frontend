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
    };
  };
  is_ai_message?: boolean; // Optional hint from frontend, backend will verify
  is_group_chat?: boolean; // Tell backend if this is a group chat
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
  joinChat: (chatId: string, userId?: string) => void;
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

// Log WebSocket configuration on module load
console.log('🔧 [WebSocket] Configuration:', {
  WS_URL,
  hasEnvVar: !!process.env.NEXT_PUBLIC_CHAT_WS_URL,
  envVarValue: process.env.NEXT_PUBLIC_CHAT_WS_URL || 'not set',
  protocol: WS_URL.startsWith('wss://') ? 'WSS (secure)' : WS_URL.startsWith('ws://') ? 'WS (insecure)' : 'UNKNOWN',
  isLocalhost: WS_URL.includes('localhost') || WS_URL.includes('127.0.0.1'),
});

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
    const readyStateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    
    if (currentReadyState === WebSocket.OPEN) {
      console.log('🔄 [WebSocket] Already connected, skipping. ReadyState:', readyStateNames[currentReadyState]);
      return;
    }

    if (currentReadyState !== undefined) {
      console.log('🔄 [WebSocket] Previous connection state:', readyStateNames[currentReadyState]);
    }

    const connectionStartTime = Date.now();
    console.log('🔄 [WebSocket] ===== CONNECTION ATTEMPT START =====');
    console.log('🔄 [WebSocket] URL:', WS_URL);
    console.log('🔄 [WebSocket] Timestamp:', new Date().toISOString());
    console.log('🔄 [WebSocket] Current state:', state);
    console.log('🔄 [WebSocket] Reconnect attempt:', reconnectAttemptsRef.current, '/', MAX_RECONNECT_ATTEMPTS);
    console.log('🔄 [WebSocket] Protocol:', WS_URL.startsWith('wss://') ? 'WSS (secure)' : 'WS (insecure)');
    
    setState("connecting");
    console.log('🔄 [WebSocket] State set to connecting');

    try {
      console.log('🔄 [WebSocket] Creating WebSocket instance...');
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      
      console.log('🔄 [WebSocket] WebSocket instance created. Initial readyState:', readyStateNames[ws.readyState]);

      ws.onopen = (event) => {
        const connectionTime = Date.now() - connectionStartTime;
        console.log('🟢 [WebSocket] ===== CONNECTION SUCCESS =====');
        console.log('🟢 [WebSocket] Connected to:', WS_URL);
        console.log('🟢 [WebSocket] Connection time:', connectionTime, 'ms');
        console.log('🟢 [WebSocket] ReadyState:', readyStateNames[ws.readyState]);
        console.log('🟢 [WebSocket] Event details:', {
          type: event.type,
          target: event.target?.constructor?.name,
        });
        
        setState("connected");
        reconnectAttemptsRef.current = 0;
        console.log('✅ [WebSocket] Connection state updated to connected');

        // Rejoin current chat if there was one
        if (currentChatIdRef.current && ws.readyState === WebSocket.OPEN) {
          console.log('🔄 [WebSocket] Rejoining chat:', currentChatIdRef.current);
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
          console.log('📨 [WebSocket] Raw message received:', parsed);
          
          // Check if it's a RoomMessage format (from backend broadcast)
          if (parsed.room_id && parsed.payload && !parsed.type) {
            // Convert RoomMessage to ChatMessage event
            const chatMessage = parsed.payload as ChatMessage;
            console.log('📨 [WebSocket] RoomMessage received, converting to ChatMessage event');
            
            // Emit as ChatMessage event
            const eventHandlers = eventHandlersRef.current.get(MessageType.ChatMessage);
            if (eventHandlers) {
              eventHandlers.forEach((handler) => {
                try {
                  handler({ room_id: parsed.room_id, payload: chatMessage });
                } catch (error) {
                  console.error('❌ [WebSocket] Error in ChatMessage handler:', error);
                }
              });
            }
            return;
          }
          
          // Otherwise, treat as WebSocketMessage
          if (!parsed.type) {
            console.warn('⚠️ [WebSocket] Message missing type field:', parsed);
            return;
          }
          
          const message: WebSocketMessage = parsed;
          console.log('📨 [WebSocket] WebSocketMessage received:', message.type);

          // Notify all message handlers
          messageHandlersRef.current.forEach((handler) => {
            try {
              handler(message);
            } catch (error) {
              console.error('❌ [WebSocket] Error in message handler:', error);
            }
          });

          // Notify event-specific handlers
          const eventHandlers = eventHandlersRef.current.get(message.type);
          if (eventHandlers) {
            eventHandlers.forEach((handler) => {
              try {
                handler(message.payload);
              } catch (error) {
                console.error('❌ [WebSocket] Error in event handler:', error);
              }
            });
          }
        } catch (error) {
          console.error('❌ [WebSocket] Error parsing message:', error, event.data);
        }
      };

      ws.onerror = (error) => {
        const connectionTime = Date.now() - connectionStartTime;
        console.error('❌ [WebSocket] ===== CONNECTION ERROR =====');
        console.error('❌ [WebSocket] Error event:', error);
        console.error('❌ [WebSocket] Error type:', error.type);
        console.error('❌ [WebSocket] Error target:', error.target);
        console.error('❌ [WebSocket] URL attempted:', WS_URL);
        console.error('❌ [WebSocket] ReadyState at error:', readyStateNames[ws.readyState]);
        console.error('❌ [WebSocket] Connection attempt duration:', connectionTime, 'ms');
        console.error('❌ [WebSocket] Reconnect attempt:', reconnectAttemptsRef.current);
        
        // Try to get more error details from the WebSocket
        if (ws.readyState === WebSocket.CLOSED) {
          console.error('❌ [WebSocket] WebSocket is CLOSED');
        } else if (ws.readyState === WebSocket.CONNECTING) {
          console.error('❌ [WebSocket] WebSocket is still CONNECTING - error occurred during handshake');
        }
        
        // Check for common error scenarios
        if (WS_URL.startsWith('ws://') && window.location.protocol === 'https:') {
          console.error('⚠️ [WebSocket] SECURITY ISSUE: Trying to use ws:// (insecure) on https:// page. Use wss:// instead!');
        }
        
        if (!WS_URL.includes('://')) {
          console.error('⚠️ [WebSocket] INVALID URL: Missing protocol (ws:// or wss://)');
        }
        
        setState("error");
      };

      ws.onclose = (event) => {
        const connectionTime = Date.now() - connectionStartTime;
        console.log('🔴 [WebSocket] ===== CONNECTION CLOSED =====');
        console.log('🔴 [WebSocket] Close code:', event.code);
        console.log('🔴 [WebSocket] Close reason:', event.reason || '(no reason provided)');
        console.log('🔴 [WebSocket] Was clean:', event.wasClean);
        console.log('🔴 [WebSocket] URL:', WS_URL);
        console.log('🔴 [WebSocket] Connection duration:', connectionTime, 'ms');
        console.log('🔴 [WebSocket] Reconnect attempt:', reconnectAttemptsRef.current);
        
        // Decode close codes
        const closeCodeMeanings: Record<number, string> = {
          1000: 'Normal Closure',
          1001: 'Going Away',
          1002: 'Protocol Error',
          1003: 'Unsupported Data',
          1006: 'Abnormal Closure (no close frame received)',
          1007: 'Invalid Frame Payload Data',
          1008: 'Policy Violation',
          1009: 'Message Too Big',
          1010: 'Mandatory Extension',
          1011: 'Internal Server Error',
          1012: 'Service Restart',
          1013: 'Try Again Later',
          1014: 'Bad Gateway',
          1015: 'TLS Handshake Failed',
        };
        
        const codeMeaning = closeCodeMeanings[event.code] || 'Unknown code';
        console.log('🔴 [WebSocket] Close code meaning:', codeMeaning);
        
        if (event.code === 1006) {
          console.error('⚠️ [WebSocket] Abnormal closure (1006) - This usually means:');
          console.error('   - Network connection was lost');
          console.error('   - Server closed connection unexpectedly');
          console.error('   - Firewall/proxy blocking the connection');
          console.error('   - SSL/TLS handshake failed (if using wss://)');
          console.error('   - Server not running or unreachable');
        }
        
        if (!event.wasClean) {
          console.error('⚠️ [WebSocket] Connection was NOT cleanly closed - indicates an error');
        }
        
        setState("disconnected");
        wsRef.current = null;

        // Attempt reconnect if needed
        if (shouldReconnectRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          const delay = RECONNECT_DELAY * reconnectAttemptsRef.current;
          console.log(`🔄 [WebSocket] Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 [WebSocket] Executing reconnect attempt ${reconnectAttemptsRef.current}`);
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error('❌ [WebSocket] Max reconnect attempts reached. Stopping reconnection.');
          console.error('❌ [WebSocket] Final state: error');
          setState("error");
        }
      };
    } catch (error) {
      const connectionTime = Date.now() - connectionStartTime;
      console.error('❌ [WebSocket] ===== EXCEPTION DURING CONNECTION =====');
      console.error('❌ [WebSocket] Exception:', error);
      console.error('❌ [WebSocket] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ [WebSocket] Error message:', error instanceof Error ? error.message : String(error));
      console.error('❌ [WebSocket] URL attempted:', WS_URL);
      console.error('❌ [WebSocket] Connection attempt duration:', connectionTime, 'ms');
      
      if (error instanceof Error && error.stack) {
        console.error('❌ [WebSocket] Stack trace:', error.stack);
      }
      
      setState("error");
    }
  }, [state]);

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
    const readyState = wsRef.current?.readyState;
    const readyStateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    
    if (readyState !== WebSocket.OPEN) {
      console.error('❌ [WebSocket] Cannot send message - WebSocket not open');
      console.error('❌ [WebSocket] Current readyState:', readyState !== undefined ? readyStateNames[readyState] : 'undefined');
      console.error('❌ [WebSocket] Connection state:', state);
      console.error('❌ [WebSocket] WebSocket instance exists:', !!wsRef.current);
      console.error('❌ [WebSocket] Message data:', JSON.stringify(data).substring(0, 100));
      return;
    }

    const message: WebSocketMessage = {
      type: MessageType.ChatMessage,
      payload: { ...data, user_id: data.user_id || currentUserIdRef.current || undefined },
      timestamp: Date.now(),
      message_id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    };

    const messageStr = JSON.stringify(message);
    console.log('📤 [WebSocket] Sending ChatMessage:', messageStr.substring(0, 200));
    // At this point we already know readyState === OPEN, but add a final defensive check for TypeScript
    if (wsRef.current) {
      wsRef.current.send(messageStr);
    } else {
      console.error('❌ [WebSocket] Tried to send message but wsRef.current was null after readyState check');
    }
  }, [state]);

  const sendStop = useCallback((chatId: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    const stopMessage: WebSocketMessage = {
      type: MessageType.StopGeneration,
      payload: { chat_id: chatId },
      timestamp: Date.now(),
      message_id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    } as any;
    wsRef.current.send(JSON.stringify(stopMessage));
  }, []);

  const joinChat = useCallback((chatId: string, userId?: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      // Store chatId to join after connection
      currentChatIdRef.current = chatId;
      currentUserIdRef.current = userId || null;
      return;
    }

    const message: WebSocketMessage = {
      type: MessageType.JoinChat,
      payload: { chat_id: chatId, user_id: userId },
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
    console.log('🔄 [WebSocket] useEffect triggered - connecting...');
    console.log('🔄 [WebSocket] Component mounted, initializing connection');
    connect();
    return () => {
      console.log('🔄 [WebSocket] Component unmounting, disconnecting...');
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Log state changes
  useEffect(() => {
    console.log('🔄 [WebSocket] State changed to:', state);
    console.log('🔄 [WebSocket] Current readyState:', wsRef.current ? readyStateNames[wsRef.current.readyState] : 'no WebSocket instance');
  }, [state]);

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

