"use client";

import { useState, useEffect, useMemo } from "react";

import { User } from "../../db/schema";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface UserSearchProps {
  onUserSelect: (user: { id: string; email: string }) => void;
  excludeUserIds?: string[];
  placeholder?: string;
}

export function UserSearch({ 
  onUserSelect, 
  excludeUserIds = [],
  placeholder = "Search users by email..."
}: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; email: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/user/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          // Filter out excluded users
          const filtered = (data.users || []).filter(
            (user: { id: string; email: string }) => !excludeUserIds.includes(user.id)
          );
          setSearchResults(filtered);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Failed to search users:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, excludeUserIds]);

  const handleUserSelect = (user: { id: string; email: string }) => {
    onUserSelect(user);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative w-full">
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => {
          if (searchResults.length > 0) {
            setShowResults(true);
          }
        }}
        onBlur={() => {
          // Delay hiding to allow click events
          setTimeout(() => setShowResults(false), 200);
        }}
        className="w-full"
      />

      {/* Search Results */}
      {showResults && (searchQuery.trim() || searchResults.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-zinc-200 dark:border-zinc-700">
                {searchResults.length} user{searchResults.length !== 1 ? "s" : ""} found
              </div>
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full text-left p-3 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.email}
                  </div>
                </button>
              ))}
            </>
          ) : searchQuery.trim() ? (
            <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              No users found matching &quot;{searchQuery}&quot;
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
