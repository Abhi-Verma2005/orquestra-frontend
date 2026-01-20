/**
 * Centralized WebSocket Event Manager
 *
 * This hook is the single source of truth for WebSocket event handling.
 * It maintains a clear state machine and handles all state transitions.
 */

import { useReducer, useEffect, useCallback } from 'react';

import type { ChatUIState, ToolInvocation, ChatUIEvent, TextDeltaPayload, FunctionCallStartPayload, FunctionCallPayload, FunctionCallEndPayload } from '@/types/chat-ui-state';

import { useWebSocket, MessageType } from '@/contexts/websocket-context';


interface WebSocketEventsState {
  uiState: ChatUIState;
  streamingText: string;
  toolInvocations: ToolInvocation[];
  executingTools: Set<string>;
  currentMessageId: string | null; // Tracks which message current tool invocations belong to
}

const initialState: WebSocketEventsState = {
  uiState: { type: 'idle' },
  streamingText: '',
  toolInvocations: [],
  executingTools: new Set(),
  currentMessageId: null,
};

/**
 * State reducer - handles all state transitions
 */
function chatUIReducer(
  state: WebSocketEventsState,
  event: ChatUIEvent
): WebSocketEventsState {
  switch (event.type) {
    case 'TEXT_DELTA_RECEIVED': {
      const newText = state.streamingText + event.delta;

      // State transition logic
      if (state.uiState.type === 'idle') {
        return {
          ...state,
          uiState: { type: 'thinking' },
          streamingText: newText,
        };
      }

      // If we have accumulated enough text, transition to streaming
      if (
        state.uiState.type === 'thinking' &&
        newText.trim().length > 10
      ) {
        return {
          ...state,
          uiState: { type: 'streaming_text', text: newText },
          streamingText: newText,
        };
      }

      // If already streaming, just update the text
      if (state.uiState.type === 'streaming_text') {
        return {
          ...state,
          uiState: { type: 'streaming_text', text: newText },
          streamingText: newText,
        };
      }

      // If executing tool, accumulate text but stay in tool state
      if (state.uiState.type === 'executing_tool') {
        return {
          ...state,
          streamingText: newText,
        };
      }

      // Default: just update streaming text
      return {
        ...state,
        streamingText: newText,
      };
    }

    case 'TOOL_START': {
      const newExecutingTools = new Set(state.executingTools);
      newExecutingTools.add(event.toolName);

      // If no current message ID exists, generate one now
      // This handles the case where tool calls start before any text is streamed
      const messageId = state.currentMessageId || `stream_${Date.now()}`;

      // Create a new tool invocation card in loading state
      // Tag it with the current message ID for proper association
      const newInvocation: ToolInvocation = {
        id: event.toolId,
        name: event.toolName,
        state: 'loading',
        timestamp: Date.now(),
        messageId: messageId,
      };

      return {
        ...state,
        uiState: { type: 'executing_tool', toolName: event.toolName },
        executingTools: newExecutingTools,
        toolInvocations: [...state.toolInvocations, newInvocation],
        // Set the message ID if it wasn't set (tool call started before text)
        currentMessageId: messageId,
      };
    }

    case 'TOOL_ARGS_RECEIVED': {
      // Find the most recent loading invocation with matching name and update it
      // with the real ID and args
      let updated = false;
      const updatedInvocations = [...state.toolInvocations];

      // Find from the end (most recent)
      for (let i = updatedInvocations.length - 1; i >= 0; i--) {
        const inv = updatedInvocations[i];
        if (inv.name === event.toolName && inv.state === 'loading' && !updated) {
          updatedInvocations[i] = {
            ...inv,
            id: event.toolId, // Replace temp ID with real ID
            args: event.args,
          };
          updated = true;
          break;
        }
      }

      return {
        ...state,
        toolInvocations: updatedInvocations,
      };
    }

    case 'TOOL_RESULT_RECEIVED': {
      // Find the most recent loading invocation with matching name and update with result
      let updated = false;
      const updatedInvocations = [...state.toolInvocations];

      // Find from the end (most recent)
      for (let i = updatedInvocations.length - 1; i >= 0; i--) {
        const inv = updatedInvocations[i];
        if (inv.name === event.toolName && inv.state === 'loading' && !updated) {
          updatedInvocations[i] = {
            ...inv,
            result: event.result,
          };
          updated = true;
          break;
        }
      }

      return {
        ...state,
        toolInvocations: updatedInvocations,
      };
    }

    case 'TOOL_PROGRESS': {
      // Update progress for a tool invocation
      const updatedInvocations = [...state.toolInvocations];
      let updated = false;

      // Find by tool ID (most reliable)
      for (let i = updatedInvocations.length - 1; i >= 0; i--) {
        const inv = updatedInvocations[i];
        if (inv.id === event.toolId && inv.state === 'loading') {
          updatedInvocations[i] = {
            ...inv,
            progress: event.progress,
            progressMessage: event.message,
          };
          updated = true;
          break;
        }
      }

      return {
        ...state,
        toolInvocations: updatedInvocations,
      };
    }

    case 'TOOL_END': {
      const newExecutingTools = new Set(state.executingTools);
      newExecutingTools.delete(event.toolName);

      // Mark the tool invocation as complete
      // When matching by name only, match the LAST (most recent) loading tool with that name
      const updatedInvocations = [...state.toolInvocations];
      let matched = false;
      
      if (event.toolId) {
        // Match by ID if provided (most reliable) - find from end (most recent)
        for (let i = updatedInvocations.length - 1; i >= 0; i--) {
          const inv = updatedInvocations[i];
          if (inv.id === event.toolId && inv.state === 'loading') {
            updatedInvocations[i] = { ...inv, state: 'complete' as const };
            matched = true;
            break;
          }
        }
      }
      
      // If no match by ID, try matching by name
      if (!matched) {
        for (let i = updatedInvocations.length - 1; i >= 0; i--) {
          const inv = updatedInvocations[i];
          if (inv.name === event.toolName && inv.state === 'loading') {
            updatedInvocations[i] = { ...inv, state: 'complete' as const };
            matched = true;
            break;
          }
        }
      }

      // If we still have streaming text and no other tools executing, go back to streaming
      if (state.streamingText && newExecutingTools.size === 0) {
        return {
          ...state,
          uiState: {
            type: 'streaming_text',
            text: state.streamingText,
          },
          executingTools: newExecutingTools,
          toolInvocations: updatedInvocations,
        };
      }

      // If other tools still executing, stay in tool state
      if (newExecutingTools.size > 0) {
        const nextTool = Array.from(newExecutingTools)[0];
        return {
          ...state,
          uiState: { type: 'executing_tool', toolName: nextTool },
          executingTools: newExecutingTools,
          toolInvocations: updatedInvocations,
        };
      }

      return {
        ...state,
        executingTools: newExecutingTools,
        toolInvocations: updatedInvocations,
      };
    }

    case 'STREAM_END': {
      return {
        ...state,
        uiState: { type: 'complete' },
      };
    }

    case 'RESET': {
      // Clear ALL tool invocations on reset - they should already be saved in the messages array (from DB)
      // WebSocket state should only contain tool invocations for the CURRENT streaming message
      // Historical tool invocations come from the messages array, not from WebSocket state
      return initialState;
    }

    case 'SET_CURRENT_MESSAGE_ID': {
      return {
        ...state,
        currentMessageId: event.messageId,
      };
    }

    default:
      return state;
  }
}

/**
 * Hook: useWebSocketEvents
 *
 * Manages WebSocket event subscriptions and state machine
 */
export function useWebSocketEvents(chatId: string | null) {
  const { onEvent } = useWebSocket();
  const [state, dispatch] = useReducer(chatUIReducer, initialState);

  // Reset state when chat changes
  useEffect(() => {
    dispatch({ type: 'RESET' });
  }, [chatId]);

  // Subscribe to TextStream (TextDelta) events
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = onEvent(
      MessageType.TextStream,
      (p: any) => {
        const payload = p as TextDeltaPayload;
        dispatch({
          type: 'TEXT_DELTA_RECEIVED',
          delta: payload.delta,
        });
      }
    );

    return unsubscribe;
  }, [chatId, onEvent]);

  // Subscribe to FunctionCallStart events
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = onEvent(
      MessageType.FunctionCallStart,
      (p: any) => {
        const payload = p as FunctionCallStartPayload;
        // Generate temporary ID (will be replaced when FunctionCall arrives)
        const tempId = `temp_${payload.name}_${Date.now()}`;

        dispatch({
          type: 'TOOL_START',
          toolName: payload.name,
          toolId: tempId,
        });
      }
    );

    return unsubscribe;
  }, [chatId, onEvent]);

  // Subscribe to FunctionCall events (tool args/parameters)
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = onEvent(
      MessageType.FunctionCall,
      (p: any) => {
        const payload = p as FunctionCallPayload;
        // Dispatch tool args to update the card
        dispatch({
          type: 'TOOL_ARGS_RECEIVED',
          toolId: payload.id,
          toolName: payload.name,
          args: payload.params,
        });
      }
    );

    return unsubscribe;
  }, [chatId, onEvent]);

  // Subscribe to FunctionResult events (tool output/result)
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = onEvent(
      MessageType.FunctionResult,
      (p: any) => {
        const payload = p as { name: string; result: unknown };
        // Dispatch tool result to update the card
        dispatch({
          type: 'TOOL_RESULT_RECEIVED',
          toolName: payload.name,
          result: payload.result,
        });
      }
    );

    return unsubscribe;
  }, [chatId, onEvent]);

  // Subscribe to FunctionCallEnd events
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = onEvent(
      MessageType.FunctionCallEnd,
      (p: any) => {
        const payload = p as FunctionCallEndPayload;
        dispatch({
          type: 'TOOL_END',
          toolName: payload.name,
          toolId: payload.tool_id,
        });
      }
    );

    return unsubscribe;
  }, [chatId, onEvent]);

  // Subscribe to ProgressUpdate events (tool execution progress)
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = onEvent(
      MessageType.ProgressUpdate,
      (payload: unknown) => {
        const progressPayload = payload as {
          tool_id: string;
          tool_name: string;
          message: string;
          progress?: number;
        };
        
        dispatch({
          type: 'TOOL_PROGRESS',
          toolId: progressPayload.tool_id,
          message: progressPayload.message,
          progress: progressPayload.progress,
        });
      }
    );

    return unsubscribe;
  }, [chatId, onEvent]);

  // Subscribe to TextStreamEnd events
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = onEvent(
      MessageType.TextStreamEnd,
      () => {
        dispatch({ type: 'STREAM_END' });
      }
    );

    return unsubscribe;
  }, [chatId, onEvent]);

  // Derived state helpers
  const isThinking = state.uiState.type === 'thinking';
  const isStreamingText = state.uiState.type === 'streaming_text';
  const isExecutingTool = state.uiState.type === 'executing_tool';
  const isComplete = state.uiState.type === 'complete';
  const isIdle = state.uiState.type === 'idle';

  // Manual reset function (for when user sends new message)
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Set the current message ID (call when a new assistant message starts)
  const setCurrentMessageId = useCallback((messageId: string) => {
    dispatch({ type: 'SET_CURRENT_MESSAGE_ID', messageId });
  }, []);

  // Get tool invocations for a specific message
  const getToolInvocationsForMessage = useCallback((messageId: string) => {
    return state.toolInvocations.filter(inv => inv.messageId === messageId);
  }, [state.toolInvocations]);

  // Get tool invocations for the current message ONLY
  // Must explicitly match the current message ID - no fallback to invocations without messageId
  // This prevents tool invocations from one message bleeding into another
  const currentMessageToolInvocations = state.currentMessageId
    ? state.toolInvocations.filter(inv => inv.messageId === state.currentMessageId)
    : [];

  return {
    // Current state
    uiState: state.uiState,
    streamingText: state.streamingText,
    toolInvocations: state.toolInvocations,
    currentMessageToolInvocations, // Tool invocations for the current message only
    executingTools: state.executingTools,
    currentMessageId: state.currentMessageId,

    // Helpers
    isThinking,
    isStreamingText,
    isExecutingTool,
    isComplete,
    isIdle,

    // Actions
    resetState,
    setCurrentMessageId,
    getToolInvocationsForMessage,
  };
}
