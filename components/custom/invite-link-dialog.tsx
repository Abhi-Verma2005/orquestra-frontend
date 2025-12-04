"use client";

import { Copy, Check, Users, Search, UserPlus, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InviteLinkDialogProps {
  chatId: string;
  onInviteCreated?: (inviteUrl: string) => void;
}

export function InviteLinkDialog({ chatId, onInviteCreated }: InviteLinkDialogProps) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; email: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedUserIds, setAddedUserIds] = useState<Set<string>>(new Set());
  const [isAddingUserId, setIsAddingUserId] = useState<string | null>(null);

  const generateInvite = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create invite");
      }

      const data = await response.json();
      setInviteUrl(data.inviteUrl);
      onInviteCreated?.(data.inviteUrl);
    } catch (error) {
      console.error("Error creating invite:", error);
      alert("Failed to create invite link");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!inviteUrl) return;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when dialog closes
      setInviteUrl(null);
      setCopied(false);
      setSearchQuery("");
      setSearchResults([]);
      setAddedUserIds(new Set());
      setIsAddingUserId(null);
    } else if (!inviteUrl) {
      // Generate invite when dialog opens
      generateInvite();
    }
  };

  // Debounced search for users by email / id
  useEffect(() => {
    if (!open) return;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) {
          throw new Error("Failed to search users");
        }
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch (err) {
        console.error("Error searching users:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, open]);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Invite
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Invite People to Chat</AlertDialogTitle>
          <AlertDialogDescription>
            Share this link or search for users to invite them to this chat.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Generating invite link...
            </div>
          ) : inviteUrl ? (
            <>
              <div className="flex gap-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can join the chat. Share it securely.
              </p>
            </>
          ) : null}

          {/* User search section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Search users by email or ID
              </span>
            </div>
            <Input
              placeholder="Type a username or email to find someone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="text-xs text-muted-foreground">
                Searching users...
              </div>
            )}
            {!isSearching && searchQuery.trim() && (
              <div className="max-h-40 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                {searchResults.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    No users found for &quot;{searchQuery.trim()}&quot;.
                  </div>
                ) : (
                  searchResults.map((user) => {
                    const alreadyAdded = addedUserIds.has(user.id);
                    const isAdding = isAddingUserId === user.id;
                    return (
                      <div
                        key={user.id}
                        className="text-xs text-foreground flex items-center justify-between rounded px-2 py-1 hover:bg-muted cursor-default"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{user.email}</span>
                          <span className="text-[10px] text-muted-foreground">
                            ID: {user.id}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={alreadyAdded || isAdding}
                          onClick={async () => {
                            try {
                              setIsAddingUserId(user.id);
                              const res = await fetch("/api/chat/members", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  chatId,
                                  userId: user.id,
                                }),
                              });
                              if (!res.ok) {
                                console.error("Failed to add member:", await res.text());
                                return;
                              }
                              setAddedUserIds((prev) => {
                                const next = new Set(prev);
                                next.add(user.id);
                                return next;
                              });
                            } catch (err) {
                              console.error("Error adding member:", err);
                            } finally {
                              setIsAddingUserId(null);
                            }
                          }}
                          className="shrink-0"
                          title={alreadyAdded ? "Already in chat" : "Add to chat"}
                        >
                          {alreadyAdded ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          {inviteUrl && (
            <AlertDialogAction onClick={copyToClipboard}>
              {copied ? "Copied!" : "Copy Link"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


