/**
 * ChatSidebar Component
 * 
 * Left sidebar wrapper with collapse state
 * 
 * @example
 * ```tsx
 * <ChatSidebar user={user} onCollapseChange={setIsLeftSidebarCollapsed} />
 * ```
 */

'use client';

import { LeftSidebar } from '@/components/custom/left-sidebar';

interface ChatSidebarProps {
  user?: any;
  onCollapseChange: (collapsed: boolean) => void;
}

export function ChatSidebar({ user, onCollapseChange }: ChatSidebarProps) {
  return (
    <div className="absolute left-4 top-4 z-30">
      <LeftSidebar user={user} onCollapseChange={onCollapseChange} />
    </div>
  );
}
