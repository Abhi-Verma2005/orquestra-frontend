import {
  CoreMessage,
  CoreToolMessage,
  generateId,
  Message,
  ToolInvocation,
} from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { Chat } from "../db/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      "An error occurred while fetching the data.",
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem(key) || "[]");
  }
  return [];
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage & { tool_call_id?: string; toolCallId?: string };
  messages: Array<Message>;
}): Array<Message> {
  // Extract tool_call_id from various possible locations (handle both snake_case and camelCase)
  const toolCallId = (toolMessage as any).tool_call_id
    || (toolMessage as any).toolCallId
    || (toolMessage as any).id;

  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          // Check for tool call ID match - handle both standard CoreToolMessage and our custom format
          let isMatch = false;
          let toolResult: any = null;

          if (Array.isArray(toolMessage.content)) {
            // Standard CoreToolMessage format with content array
            const found = toolMessage.content.find(
              (tool) => tool.toolCallId === toolInvocation.toolCallId,
            );
            if (found) {
              isMatch = true;
              toolResult = found.result;
            }
          } else if (toolCallId && toolCallId === toolInvocation.toolCallId) {
            // Custom format: tool_call_id at top level, content is the result
            isMatch = true;
            toolResult = toolMessage.content;
          }

          if (isMatch) {
            return {
              ...toolInvocation,
              state: "result",
              result: toolResult,
            };
          }

          return toolInvocation;
        }),
      };
    }

    return message;
  });
}

// Helper function to normalize content to string
function normalizeMessageContent(content: any): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    // Handle array of content blocks (e.g., [{type: "text", content: "..."}])
    return content
      .map((block) => {
        if (typeof block === "string") return block;
        if (block && typeof block === "object") {
          if (block.type === "text" && block.text) return block.text;
          if (block.content) return normalizeMessageContent(block.content);
        }
        return "";
      })
      .join("");
  }
  if (content && typeof content === "object") {
    // Handle object with content property
    if (content.content) return normalizeMessageContent(content.content);
    if (content.text) return normalizeMessageContent(content.text);
    // If it's an object without content/text, stringify it
    return JSON.stringify(content);
  }
  return String(content || "");
}

export function convertToUIMessages(
  messages: Array<(CoreMessage | Message) & { tool_calls?: any[]; tool_call_id?: string }>,
): Array<Message> {
  return messages.reduce((chatMessages: Array<Message>, message) => {
    if (message.role === "tool") {
      return addToolMessageToChat({
        toolMessage: message as any,
        messages: chatMessages,
      });
    }

    let textContent = "";
    let toolInvocations: Array<ToolInvocation> = [];

    if (typeof message.content === "string") {
      textContent = message.content;
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === "text") {
          textContent += content.text || "";
        } else if (content.type === "tool-call") {
          toolInvocations.push({
            state: "call",
            toolCallId: content.toolCallId,
            toolName: content.toolName,
            args: content.args,
          });
        }
      }
      // If no text content was found in array, try to normalize the whole array
      if (!textContent) {
        textContent = normalizeMessageContent(message.content);
      }
    } else {
      // Handle object or other types - normalize to string
      textContent = normalizeMessageContent(message.content);
    }

    // Also handle backend's tool_calls top-level field (OpenAI format)
    if (message.tool_calls && Array.isArray(message.tool_calls)) {
      console.log('[convertToUIMessages] Found tool_calls:', message.tool_calls);
      for (const tc of message.tool_calls) {
        try {
          const args = typeof tc.function.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments;

          toolInvocations.push({
            state: "call",
            toolCallId: tc.id,
            toolName: tc.function.name,
            args: args,
          });
          console.log('[convertToUIMessages] Converted tool call:', tc.function.name, args);
        } catch (e) {
          console.error('[convertToUIMessages] Failed to parse tool call arguments:', e, tc);
        }
      }
    }

    // If it's already a Message with toolInvocations, preserve them
    const existingToolInvocations = (message as Message).toolInvocations || [];
    const combinedToolInvocations = [...toolInvocations, ...existingToolInvocations];

    chatMessages.push({
      id: (message as Message).id || generateId(),
      role: message.role,
      content: textContent,
      toolInvocations: combinedToolInvocations.length > 0 ? combinedToolInvocations : undefined,
    });

    return chatMessages;
  }, []);
}

export function getTitleFromChat(chat: Chat) {
  if (chat.title && chat.title.trim().length > 0) {
    return chat.title;
  }

  const messages = convertToUIMessages(chat.messages as Array<CoreMessage>);
  const firstMessage = messages[0];

  if (!firstMessage) {
    return "Untitled";
  }

  return firstMessage.content;
}

// Chart utility functions
export const formatValue = (value: number): string => Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumSignificantDigits: 3,
  notation: 'compact',
}).format(value)

export const formatThousands = (value: number): string => Intl.NumberFormat('en-US', {
  maximumSignificantDigits: 3,
  notation: 'compact',
}).format(value)

export const getCssVariable = (variable: string): string => {
  if (typeof window === 'undefined') {
    return '';
  }  
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
};

const adjustHexOpacity = (hexColor: string, opacity: number): string => {
  // Remove the '#' if it exists
  hexColor = hexColor.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Return RGBA string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const adjustHSLOpacity = (hslColor: string, opacity: number): string => {
  // Convert HSL to HSLA
  return hslColor.replace('hsl(', 'hsla(').replace(')', `, ${opacity})`);
};

const adjustOKLCHOpacity = (oklchColor: string, opacity: number): string => {
  // Add alpha value to OKLCH color
  return oklchColor.replace(/oklch\((.*?)\)/, (match, p1) => `oklch(${p1} / ${opacity})`);
};

export const adjustColorOpacity = (color: string, opacity: number): string => {
  if (color.startsWith('#')) {
    return adjustHexOpacity(color, opacity);
  } else if (color.startsWith('hsl')) {
    return adjustHSLOpacity(color, opacity);
  } else if (color.startsWith('oklch')) {
    return adjustOKLCHOpacity(color, opacity);
  } else {
    return "";    
  }
};

export const oklchToRGBA = (oklchColor: string): string => {
  // Create a temporary div to use for color conversion
  const tempDiv = document.createElement('div');
  tempDiv.style.color = oklchColor;
  document.body.appendChild(tempDiv);
  
  // Get the computed style and convert to RGB
  const computedColor = window.getComputedStyle(tempDiv).color;
  document.body.removeChild(tempDiv);
  
  return computedColor;
};
