"use client";

import cx from "classnames";
import Link from "next/link";
import { useParams } from "next/navigation";
import { User } from "next-auth";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import {
  InfoIcon,
  MoreHorizontalIcon,
  PencilEditIcon,
  TrashIcon,
} from "./icons";
import { Chat } from "../../db/schema";
import { fetcher, getTitleFromChat } from "../../lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";

// Sort options
type SortOption = "newest" | "oldest" | "title-asc" | "title-desc" | "recent-activity";

// Filter options
type FilterOption = "all" | "group" | "individual";

export const History = ({ 
  user, 
  isCollapsed = false, 
  onItemClick 
}: { 
  user: User | undefined; 
  isCollapsed?: boolean;
  onItemClick?: () => void;
}) => {
  const { id } = useParams();

  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<Chat>>(user ? "/api/history" : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateOnMount: true,
    revalidateIfStale: false,
    dedupingInterval: 60000,
  });

  // Search, Sort, and Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [showFilters, setShowFilters] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filter and sort chats
  const filteredAndSortedChats = useMemo(() => {
    if (!history) return [];

    let filtered = [...history];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((chat) => {
        const title = getTitleFromChat(chat).toLowerCase();
        const summary = (chat.summary || "").toLowerCase();
        // Search in messages content
        const messages = (chat.messages || []) as Array<any>;
        const messageContent = messages
          .map((msg) => (typeof msg.content === "string" ? msg.content : ""))
          .join(" ")
          .toLowerCase();
        
        return (
          title.includes(query) ||
          summary.includes(query) ||
          messageContent.includes(query)
        );
      });
    }

    // Apply type filter
    if (filterOption !== "all") {
      filtered = filtered.filter((chat) => {
        if (filterOption === "group") {
          return chat.isGroupChat === true;
        } else {
          return chat.isGroupChat === false || !chat.isGroupChat;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "recent-activity":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "title-asc":
          return getTitleFromChat(a).localeCompare(getTitleFromChat(b));
        case "title-desc":
          return getTitleFromChat(b).localeCompare(getTitleFromChat(a));
        default:
          return 0;
      }
    });

    return filtered;
  }, [history, searchQuery, sortOption, filterOption]);

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat/delete?id=${deleteId}`, {
      method: "DELETE",
    });

    toast.promise(deletePromise, {
      loading: "Deleting chat...",
      success: () => {
        mutate((history) => {
          if (history) {
            return history.filter((h) => h.id !== id);
          }
        });
        return "Chat deleted successfully";
      },
      error: "Failed to delete chat",
    });

    setShowDeleteDialog(false);
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {history?.length || 0} chats
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {user && (
          <Button
            className="w-full font-normal text-sm flex flex-row justify-between text-white"
            asChild
          >
            <Link href="/" onClick={onItemClick}>
              <div>Start a new chat</div>
              <PencilEditIcon size={14} />
            </Link>
          </Button>
        )}

        {/* Search and Filter Bar */}
        {user && (
          <div className="space-y-2">
            {/* Search Input */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    Filter: {filterOption === "all" ? "All" : filterOption === "group" ? "Groups" : "Individual"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterOption("all")}>
                    All Chats
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterOption("group")}>
                    Group Chats
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterOption("individual")}>
                    Individual Chats
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    Sort: {
                      sortOption === "newest" ? "Newest" :
                      sortOption === "oldest" ? "Oldest" :
                      sortOption === "recent-activity" ? "Recent" :
                      sortOption === "title-asc" ? "A-Z" : "Z-A"
                    }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortOption("newest")}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("oldest")}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("recent-activity")}>
                    Recent Activity
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortOption("title-asc")}>
                    Title (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("title-desc")}>
                    Title (Z-A)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Results count */}
            {(searchQuery || filterOption !== "all" || sortOption !== "newest") && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Showing {filteredAndSortedChats.length} of {history?.length || 0} chats
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col overflow-y-auto space-y-1 max-h-64">
          {!user ? (
            <div className="text-zinc-500 w-full flex flex-row justify-center items-center text-xs gap-2 py-4">
              <InfoIcon />
              <div>Login to save chats!</div>
            </div>
          ) : null}

          {!isLoading && filteredAndSortedChats.length === 0 && user ? (
            <div className="text-zinc-500 w-full flex flex-row justify-center items-center text-xs gap-2 py-4">
              <InfoIcon />
              <div>
                {searchQuery || filterOption !== "all"
                  ? "No chats match your filters"
                  : "No chats found"}
              </div>
            </div>
          ) : null}

          {isLoading && user ? (
            <div className="flex flex-col space-y-2">
              {[44, 32, 28, 52].map((item) => (
                <div key={item} className="p-2">
                  <div
                    className={`w-${item} h-[16px] rounded-md bg-zinc-200 dark:bg-zinc-600 animate-pulse`}
                  />
                </div>
              ))}
            </div>
          ) : null}

          {filteredAndSortedChats &&
            filteredAndSortedChats.map((chat) => (
              <div
                key={chat.id}
                className={cx(
                  "flex flex-row items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md pr-2",
                  { "bg-zinc-200 dark:bg-zinc-700": chat.id === id },
                )}
              >
                <Button
                  variant="ghost"
                  className={cx(
                    "hover:bg-zinc-200 dark:hover:bg-zinc-700 justify-between p-0 text-xs font-normal flex flex-row items-center gap-2 pr-2 w-full transition-none",
                  )}
                  asChild
                >
                  <Link
                    href={`/chat/${chat.id}`}
                    className="text-ellipsis overflow-hidden text-left py-1 pl-2 rounded-lg outline-zinc-900"
                    onClick={onItemClick}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {chat.isGroupChat && (
                        <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded flex-shrink-0">
                          Group
                        </span>
                      )}
                      <span className="truncate">{getTitleFromChat(chat)}</span>
                    </div>
                  </Link>
                </Button>

                <DropdownMenu modal={true}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="p-0 h-fit font-normal text-zinc-500 transition-none hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      variant="ghost"
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="left" className="z-[60]">
                    <DropdownMenuItem asChild>
                      <Button
                        className="flex flex-row gap-2 items-center justify-start w-full h-fit font-normal p-1.5 rounded-sm"
                        variant="ghost"
                        onClick={() => {
                          setDeleteId(chat.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <TrashIcon />
                        <div>Delete</div>
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};