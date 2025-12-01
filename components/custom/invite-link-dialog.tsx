"use client";

import { Copy, Check, Users } from "lucide-react";
import { useState } from "react";

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
    } else if (!inviteUrl) {
      // Generate invite when dialog opens
      generateInvite();
    }
  };

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
            Share this link to invite others to join this chat. They can use it to access the chat.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {isLoading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Generating invite link...
          </div>
        ) : inviteUrl ? (
          <div className="space-y-4">
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
          </div>
        ) : null}

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


