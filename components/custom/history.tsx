"use client";

import cx from "classnames";
import Link from "next/link";
import { useParams } from "next/navigation";
import { User } from "next-auth";
import { useSession } from "next-auth/react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Search, MoreHorizontal, Trash2, MessageSquare, Users, Hash } from "lucide-react";

import { Chat } from "../../db/schema";
import { fetcher, getTitleFromChat, getBackendUrl } from "../../lib/utils";
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
} from "../ui/dropdown-menu";

type SortOption = "newest" | "oldest" | "title-asc" | "title-desc" | "recent-activity";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");

  const { data: session } = useSession();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const filteredAndSortedChats = useMemo(() => {
    if (!history) return [];

    let filtered = [...history];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((chat) => {
        const title = getTitleFromChat(chat).toLowerCase();
        const summary = (chat.summary || "").toLowerCase();
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

    if (filterOption !== "all") {
      filtered = filtered.filter((chat) => {
        if (filterOption === "group") {
          return chat.isGroupChat === true;
        } else {
          return chat.isGroupChat === false || !chat.isGroupChat;
        }
      });
    }

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
    const backendUrl = getBackendUrl();
    const deletePromise = fetch(`${backendUrl}/api/chat/delete?id=${deleteId}`, {
      method: "DELETE",
      headers: {
        Authorization: (session as any)?.accessToken ? `Bearer ${(session as any).accessToken}` : "",
      },
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
      <div className="flex flex-col items-center justify-center py-4">
        <span className="text-[11px] text-muted-foreground/50">{history?.length || 0}</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {/* Search */}
        {user && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-8 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.04] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground text-sm transition-colors"
                >
                  ×
                </button>
              )}
            </div>

            {/* Results count */}
            {(searchQuery || filterOption !== "all") && (
              <div className="text-[10px] text-muted-foreground/40 px-1">
                {filteredAndSortedChats.length} of {history?.length || 0} chats
              </div>
            )}
          </div>
        )}

        {/* Chat List */}
        <div className="flex flex-col">
          {!user && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="size-10 rounded-full bg-white/[0.04] flex items-center justify-center">
                <MessageSquare className="size-5 text-muted-foreground/40" />
              </div>
              <span className="text-[12px] text-muted-foreground/50">Sign in to save chats</span>
            </div>
          )}

          {!isLoading && filteredAndSortedChats.length === 0 && user && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="size-10 rounded-full bg-white/[0.04] flex items-center justify-center">
                <MessageSquare className="size-5 text-muted-foreground/40" />
              </div>
              <span className="text-[12px] text-muted-foreground/50">
                {searchQuery ? "No matches found" : "No chats yet"}
              </span>
            </div>
          )}

          {isLoading && user && (
            <div className="flex flex-col gap-1 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-lg bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          )}

          {filteredAndSortedChats.map((chat) => (
            <div
              key={chat.id}
              className={cx(
                "group flex items-center gap-2 rounded-lg px-2.5 py-2 transition-all",
                chat.id === id
                  ? "bg-white/[0.08]"
                  : "hover:bg-white/[0.04]"
              )}
            >
              <Link
                href={`/chat/${chat.id}`}
                className="flex-1 min-w-0 flex items-center gap-2"
                onClick={onItemClick}
              >
                <div className={cx(
                  "size-6 rounded-md flex items-center justify-center shrink-0",
                  chat.isGroupChat ? "bg-blue-500/10" : "bg-white/[0.04]"
                )}>
                  {chat.isGroupChat ? (
                    <Users className="size-3 text-blue-400" />
                  ) : (
                    <Hash className="size-3 text-muted-foreground/50" />
                  )}
                </div>
                <span className="text-[13px] text-foreground/80 truncate group-hover:text-foreground transition-colors">
                  {getTitleFromChat(chat)}
                </span>
              </Link>

              <DropdownMenu modal={true}>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="size-6 p-0 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.08] rounded-md"
                    variant="ghost"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="bg-[#0C0C0D] border-white/[0.08] rounded-xl min-w-[140px] p-1">
                  <DropdownMenuItem
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-[12px] cursor-pointer rounded-lg px-3 py-2"
                    onClick={() => {
                      setDeleteId(chat.id);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="size-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#0C0C0D] border-white/[0.08] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Chat</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/60 text-[13px]">
              This action cannot be undone. This will permanently delete your chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/[0.08] hover:bg-white/[0.06] rounded-lg text-[13px]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 rounded-lg text-[13px]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
