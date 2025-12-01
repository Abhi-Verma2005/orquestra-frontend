"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export default function JoinChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const joinChat = async () => {
      if (!inviteCode) {
        setError("No invite code provided");
        setIsLoading(false);
        return;
      }

      try {
        // First verify the invite exists
        const inviteResponse = await fetch(`/api/chat/invite/${inviteCode}`);
        if (!inviteResponse.ok) {
          const errorData = await inviteResponse.json();
          setError(errorData.error || "Invalid invite link");
          setIsLoading(false);
          return;
        }

        // Join the chat
        const joinResponse = await fetch(`/api/chat/invite/${inviteCode}/join`, {
          method: "POST",
        });

        if (!joinResponse.ok) {
          if (joinResponse.status === 401) {
            // Not authenticated - redirect to login
            router.push(`/login?redirect=/chat/join?invite=${inviteCode}`);
            return;
          }
          const errorData = await joinResponse.json();
          setError(errorData.error || "Failed to join chat");
          setIsLoading(false);
          return;
        }

        const data = await joinResponse.json();
        
        // Redirect to the chat
        router.push(`/chat/${data.chatId}`);
      } catch (err: any) {
        console.error("Error joining chat:", err);
        setError(err.message || "An error occurred");
        setIsLoading(false);
      }
    };

    joinChat();
  }, [inviteCode, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Joining chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Unable to Join Chat</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return null;
}

