"use client";

import { X, Users } from "lucide-react";
import { useEffect, useState } from "react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ChatMember {
  id: string;
  chatId: string;
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
}

interface ChatMembersProps {
  chatId: string;
  currentUserId: string;
  isOwner: boolean;
}

export function ChatMembers({ chatId, currentUserId, isOwner }: ChatMembersProps) {
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [chatId]);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  const loadMembers = async () => {
    try {
      const response = await fetch(`/api/chat/members?chatId=${chatId}`);
      if (!response.ok) {
        throw new Error("Failed to load members");
      }
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeMember = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/chat/members?chatId=${chatId}&userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove member");
      }

      // Reload members
      await loadMembers();
      setMemberToRemove(null);
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
        >
          <Users className="size-5" />
          {members.length > 0 && (
            <Badge
              variant="secondary"
              className="absolute -right-1 -top-1 size-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {members.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Chat Members
          </SheetTitle>
          <SheetDescription>
            {members.length === 0
              ? "No members yet"
              : `${members.length} ${members.length === 1 ? "member" : "members"}`}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              No members found
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                      <Users className="size-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {member.userId === currentUserId ? "You" : member.userId}
                      </span>
                      {member.role === "owner" && (
                        <Badge variant="outline" className="mt-1 w-fit text-xs">
                          Owner
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isOwner &&
                    member.role !== "owner" &&
                    member.userId !== currentUserId && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setMemberToRemove(member.userId)}
                          >
                            <X className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this member from the chat?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => setMemberToRemove(null)}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                if (memberToRemove) {
                                  removeMember(memberToRemove);
                                }
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}


