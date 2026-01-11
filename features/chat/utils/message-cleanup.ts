/**
 * Message Cleanup Utilities
 * 
 * Pure functions for cleaning and merging initial messages
 */

import type { Message, ToolInvocation } from "ai";

/**
 * Cleans up initial messages by merging empty assistant messages with tool invocations
 * into adjacent messages with content
 * 
 * @param initialMessages - Array of initial messages from database
 * @returns Cleaned array of messages with merged tool invocations
 * 
 * @example
 * ```ts
 * const cleaned = cleanInitialMessages([
 *   { role: "assistant", content: "", toolInvocations: [...] },
 *   { role: "assistant", content: "Response text" }
 * ]);
 * // Returns: [{ role: "assistant", content: "Response text", toolInvocations: [...] }]
 * ```
 */
export function cleanInitialMessages(
  initialMessages: Array<Message>
): Array<Message> {
  if (!initialMessages || initialMessages.length === 0) return [];

  const cleaned: Array<Message> = [];
  const pendingToolInvocations: Array<ToolInvocation>[] = []; // Track tool invocations from skipped messages

  for (let i = 0; i < initialMessages.length; i++) {
    const currentMsg = initialMessages[i];

    // If it's an assistant message with empty content but has tool invocations
    if (
      currentMsg.role === "assistant" &&
      (!currentMsg.content || currentMsg.content.trim() === "") &&
      currentMsg.toolInvocations &&
      currentMsg.toolInvocations.length > 0
    ) {
      // Look ahead to see if there's a next assistant message with content
      let hasNextAssistantWithContent = false;

      for (let j = i + 1; j < initialMessages.length; j++) {
        if (
          initialMessages[j].role === "assistant" &&
          initialMessages[j].content &&
          initialMessages[j].content.trim() !== ""
        ) {
          hasNextAssistantWithContent = true;
          // Store tool invocations to merge into the next assistant message
          pendingToolInvocations.push(currentMsg.toolInvocations || []);
          break;
        }
        // Stop if we hit a user message
        if (initialMessages[j].role === "user") {
          break;
        }
      }

      // If there's a next assistant with content, skip this empty message
      // The tool invocations will be merged when we process that message
      if (hasNextAssistantWithContent) {
        continue; // Skip this empty message
      } else {
        // No next assistant with content, keep it (might need to show tool invocations)
        cleaned.push(currentMsg);
      }
    } else if (
      currentMsg.role === "assistant" &&
      currentMsg.content &&
      currentMsg.content.trim() !== "" &&
      pendingToolInvocations.length > 0
    ) {
      // This is an assistant message with content, merge any pending tool invocations
      const mergedToolInvocations = [
        ...pendingToolInvocations.flat(),
        ...(currentMsg.toolInvocations || []),
      ];
      cleaned.push({
        ...currentMsg,
        toolInvocations: mergedToolInvocations,
      });
      pendingToolInvocations.length = 0; // Clear pending
    } else {
      // Not an empty assistant message, add it as-is
      cleaned.push(currentMsg);
    }
  }

  return cleaned;
}
