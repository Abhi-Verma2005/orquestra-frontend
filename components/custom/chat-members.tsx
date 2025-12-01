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
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    loadMembers();
  }, [chatId]);

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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>Loading members...</span>
      </div>
    );
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Users className="h-4 w-4" />
        <span>Members ({members.length})</span>
      </div>
      <div className="space-y-1">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {member.userId === currentUserId ? "You" : member.userId}
              </span>
              {member.role === "owner" && (
                <span className="text-xs text-muted-foreground">(Owner)</span>
              )}
            </div>
            {isOwner &&
              member.role !== "owner" &&
              member.userId !== currentUserId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setMemberToRemove(member.userId)}
                    >
                      <X className="h-3 w-3" />
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
                      <AlertDialogCancel onClick={() => setMemberToRemove(null)}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => memberToRemove && removeMember(memberToRemove)}
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
    </div>
  );
}


