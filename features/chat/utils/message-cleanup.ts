/**
 * Message Cleanup Utilities
 *
 * Pure functions for cleaning and merging initial messages
 */

import type { Message, ToolInvocation } from "ai";

/**
 * Cleans up initial messages by consolidating multiple assistant messages
 * from the same "turn" (between user messages) into a single assistant message.
 *
 * This handles the case where agentic loops create multiple LLM calls per user message,
 * which are saved as separate messages in the DB but should be displayed as one.
 *
 * @param initialMessages - Array of initial messages from database
 * @returns Cleaned array of messages with consolidated assistant responses
 *
 * @example
 * ```ts
 * // Input from DB (multiple LLM calls per turn):
 * const messages = [
 *   { role: "user", content: "Tell me about Rust" },
 *   { role: "assistant", content: "Let me search...", toolInvocations: [search] },
 *   { role: "assistant", content: "Based on my search, Rust is..." }
 * ];
 *
 * // Output (consolidated):
 * const cleaned = cleanInitialMessages(messages);
 * // Returns: [
 * //   { role: "user", content: "Tell me about Rust" },
 * //   { role: "assistant", content: "Let me search...\n\nBased on my search, Rust is...", toolInvocations: [search] }
 * // ]
 * ```
 */
export function cleanInitialMessages(
  initialMessages: Array<Message>
): Array<Message> {
  if (!initialMessages || initialMessages.length === 0) return [];

  const cleaned: Array<Message> = [];
  let currentTurnAssistant: Message | null = null;
  let currentTurnToolInvocations: ToolInvocation[] = [];
  let currentTurnContent: string[] = [];

  const flushCurrentTurn = () => {
    if (currentTurnAssistant || currentTurnContent.length > 0 || currentTurnToolInvocations.length > 0) {
      // Combine all content from the turn, filtering out empty strings
      const combinedContent = currentTurnContent
        .filter(c => c && c.trim() !== '')
        .join('\n\n');

      // Deduplicate tool invocations by toolCallId
      const seenToolCallIds = new Set<string>();
      const uniqueToolInvocations = currentTurnToolInvocations.filter(inv => {
        if (seenToolCallIds.has(inv.toolCallId)) {
          return false;
        }
        seenToolCallIds.add(inv.toolCallId);
        return true;
      });

      cleaned.push({
        id: currentTurnAssistant?.id || `consolidated_${Date.now()}`,
        role: 'assistant',
        content: combinedContent,
        toolInvocations: uniqueToolInvocations.length > 0 ? uniqueToolInvocations : undefined,
      });
    }
    // Reset turn state
    currentTurnAssistant = null;
    currentTurnToolInvocations = [];
    currentTurnContent = [];
  };

  for (let i = 0; i < initialMessages.length; i++) {
    const currentMsg = initialMessages[i];

    if (currentMsg.role === 'user' || currentMsg.role === 'system') {
      // Flush any pending assistant turn before adding user/system message
      flushCurrentTurn();
      cleaned.push(currentMsg);
    } else if (currentMsg.role === 'assistant') {
      // Track first assistant message in this turn for ID
      if (!currentTurnAssistant) {
        currentTurnAssistant = currentMsg;
      }

      // Accumulate content
      if (currentMsg.content && currentMsg.content.trim() !== '') {
        currentTurnContent.push(currentMsg.content);
      }

      // Accumulate tool invocations
      if (currentMsg.toolInvocations && currentMsg.toolInvocations.length > 0) {
        currentTurnToolInvocations.push(...currentMsg.toolInvocations);
      }
    } else if (currentMsg.role === 'tool') {
      // Tool messages should update the corresponding tool invocation's result
      // Find the matching tool invocation and update it
      const toolCallId = (currentMsg as any).tool_call_id || (currentMsg as any).toolCallId;
      if (toolCallId) {
        const matchingInvocation = currentTurnToolInvocations.find(
          inv => inv.toolCallId === toolCallId
        );
        if (matchingInvocation) {
          // Update the state to 'result' and add the result
          (matchingInvocation as any).state = 'result';
          (matchingInvocation as any).result = currentMsg.content;
        }
      }
      // Don't add tool messages to the cleaned array - they're embedded in assistant messages
    } else {
      // Unknown role, add as-is
      flushCurrentTurn();
      cleaned.push(currentMsg);
    }
  }

  // Flush any remaining assistant turn
  flushCurrentTurn();

  return cleaned;
}
