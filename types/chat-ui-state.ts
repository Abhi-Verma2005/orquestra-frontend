/**
 * Chat UI State Machine Types
 *
 * Defines the state machine for chat UI based on WebSocket events
 */

// UI State Machine
export type ChatUIState =
  | { type: 'idle' }
  | { type: 'thinking' }
  | { type: 'streaming_text'; text: string }
  | { type: 'executing_tool'; toolName: string }
  | { type: 'complete' };

// WebSocket Event Payloads (matching backend protocol)
export interface TextDeltaPayload {
  delta: string;
}

export interface FunctionCallStartPayload {
  name: string; // 'get_user_info' | 'render_content' | etc.
}

export interface FunctionCallPayload {
  id: string;
  name: string;
  params: Record<string, unknown>;
}

export interface RenderContentParams {
  title: string;
  content: string;
}

export interface FunctionCallEndPayload {
  name: string;
  tool_id?: string;
  tool_result?: string;
}

export interface TextStreamEndPayload {
  // Empty payload
}

export interface ProgressUpdatePayload {
  tool_id: string;
  tool_name: string;
  message: string;
  progress?: number; // 0-100
}

// Tool Invocation Card - Visual representation of function calls
export type ToolInvocationState = 'loading' | 'complete';

export interface ToolInvocation {
  id: string;
  name: string;
  state: ToolInvocationState;
  args?: Record<string, unknown>; // Populated when FunctionCall arrives
  result?: unknown; // Populated when FunctionResult arrives
  progress?: number; // 0-100, for progress updates
  progressMessage?: string; // Current progress message
  timestamp: number;
  messageId?: string; // Associates this tool invocation with a specific message
}

// Chat UI Context State
export interface ChatUIContextState {
  // Current UI state
  uiState: ChatUIState;

  // Accumulated text during streaming
  streamingText: string;

  // Tool invocations (visual cards showing function calls)
  toolInvocations: ToolInvocation[];

  // Currently executing tools (for backward compatibility)
  executingTools: Set<string>;

  // State transition helpers
  isThinking: boolean;
  isStreamingText: boolean;
  isExecutingTool: boolean;
  isComplete: boolean;
}

// State Machine Events (internal)
export type ChatUIEvent =
  | { type: 'TEXT_DELTA_RECEIVED'; delta: string }
  | { type: 'TOOL_START'; toolName: string; toolId: string }
  | { type: 'TOOL_ARGS_RECEIVED'; toolId: string; toolName: string; args: Record<string, unknown> }
  | { type: 'TOOL_RESULT_RECEIVED'; toolName: string; result: unknown }
  | { type: 'TOOL_PROGRESS'; toolId: string; message: string; progress?: number }
  | { type: 'TOOL_END'; toolName: string; toolId?: string }
  | { type: 'STREAM_END' }
  | { type: 'RESET' }
  | { type: 'SET_CURRENT_MESSAGE_ID'; messageId: string };
