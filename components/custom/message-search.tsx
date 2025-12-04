"use client";

import { Message } from "ai";
import { X } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface MessageSearchProps {
  messages: Array<Message>;
  onMessageSelect?: (messageId: string) => void;
}

export function MessageSearch({ messages, onMessageSelect }: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find matching messages
  const matchingMessages = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return messages
      .map((msg, index) => {
        const content = typeof msg.content === "string" ? msg.content : "";
        if (content.toLowerCase().includes(query)) {
          return { message: msg, index, content };
        }
        return null;
      })
      .filter((item): item is { message: Message; index: number; content: string } => item !== null);
  }, [messages, searchQuery]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || matchingMessages.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < matchingMessages.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const selected = matchingMessages[selectedIndex];
        if (selected && onMessageSelect) {
          onMessageSelect(selected.message.id || `msg-${selected.index}`);
          setSearchQuery("");
          setIsOpen(false);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, matchingMessages, selectedIndex, onMessageSelect]);

  // Highlight search term in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search messages... (Ctrl+K)"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full text-sm pr-8"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setIsOpen(false);
              setSelectedIndex(-1);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && searchQuery.trim() && matchingMessages.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg max-h-64 overflow-y-auto">
          <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-zinc-200 dark:border-zinc-700">
            {matchingMessages.length} result{matchingMessages.length !== 1 ? "s" : ""} found
          </div>
          {matchingMessages.map((item, idx) => {
            const message = item.message;
            const role = message.role || "user";
            const content = typeof message.content === "string" ? message.content : "";
            const preview = content.length > 100 ? content.substring(0, 100) + "..." : content;

            return (
              <button
                key={message.id || `search-${idx}`}
                onClick={() => {
                  if (onMessageSelect) {
                    onMessageSelect(message.id || `msg-${item.index}`);
                  }
                  setSearchQuery("");
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors ${
                  idx === selectedIndex ? "bg-zinc-100 dark:bg-zinc-700" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      role === "user"
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    }`}
                  >
                    {role === "user" ? "You" : "Assistant"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {highlightText(preview, searchQuery)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && searchQuery.trim() && matchingMessages.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            No messages found matching &quot;{searchQuery}&quot;
          </div>
        </div>
      )}
    </div>
  );
}
