/**
 * ChatHeader Component
 * 
 * Header section with chat members, invite dialog, and group chat controls
 * 
 * @example
 * ```tsx
 * <ChatHeader id={chatId} isGroupChat={isGroupChat} user={user} isOwner={isOwner} />
 * ```
 */

'use client';

import { ChatMembers } from '@/components/custom/chat-members';
import { InviteLinkDialog } from '@/components/custom/invite-link-dialog';

interface ChatHeaderProps {
  id: string | null;
  isGroupChat: boolean;
  user?: any;
  isOwner: boolean;
}

export function ChatHeader({ id, isGroupChat, user, isOwner }: ChatHeaderProps) {
  if (!id) return null;

  return (
    <div className="absolute top-8 md:top-10 right-4 z-20 flex items-center gap-2">
      <InviteLinkDialog chatId={id} />
      {/* Show members list only if it's a group chat */}
      {isGroupChat && user && (
        <div className="bg-background/80 backdrop-blur-sm border rounded-lg p-2">
          <ChatMembers
            chatId={id}
            currentUserId={user.id}
            isOwner={isOwner}
          />
        </div>
      )}
    </div>
  );
}
