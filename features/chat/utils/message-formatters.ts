/**
 * Message Formatting Utilities
 * 
 * Pure functions for normalizing and formatting message content
 */

/**
 * Normalizes content to string format
 * Handles cases where content might be an object, array, or string
 * 
 * @param content - Content to normalize (can be string, array, or object)
 * @returns Normalized string content
 * 
 * @example
 * ```ts
 * normalizeContent("Hello") // "Hello"
 * normalizeContent({ content: "Hello" }) // "Hello"
 * normalizeContent([{ type: "text", content: "Hello" }]) // "Hello"
 * ```
 */
export function normalizeContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    // Handle array of content blocks (e.g., [{type: "text", content: "..."}])
    return content
      .map((block) => {
        if (typeof block === "string") return block;
        if (block && typeof block === "object") {
          if ((block as any).type === "text" && (block as any).text) return (block as any).text;
          if ((block as any).content) return normalizeContent((block as any).content);
        }
        return "";
      })
      .join("");
  }
  if (content && typeof content === "object") {
    // Handle object with content property
    if ((content as any).content) return normalizeContent((content as any).content);
    if ((content as any).text) return normalizeContent((content as any).text);
    // If it's an object without content/text, stringify it
    return JSON.stringify(content);
  }
  return String(content || "");
}
